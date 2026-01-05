//! Polymarket Insider Activity Tracker (Rust)
//!
//! Detects REAL insider trading: fresh wallets placing large contrarian bets
//! on political/corporate events (NOT crypto gambling markets).
//!
//! Usage:
//!   cargo run --release

mod api;
mod config;
mod types;

use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use colored::*;
use tokio::time::sleep;

use api::{mask_address, ApiClient};
use config::{
    discord_webhook_url, max_unique_markets, min_trade_size_usd, max_price_threshold,
    poll_interval_ms, telegram_bot_token, telegram_chat_id, telegram_enabled,
    is_gambling_market,
};
use types::{AlertLevel, SuspectTrade, Trade, UserStats};

// ============================================================================
// STATE (simplified - no more cluster/volume noise)
// ============================================================================

struct TrackerState {
    processed_trade_ids: HashSet<String>,
    user_stats_cache: HashMap<String, (UserStats, Instant)>,
    poll_count: u64,
}

impl TrackerState {
    fn new() -> Self {
        Self {
            processed_trade_ids: HashSet::new(),
            user_stats_cache: HashMap::new(),
            poll_count: 0,
        }
    }
}

const USER_CACHE_TTL_SECS: u64 = 60;

// ============================================================================
// MAIN
// ============================================================================

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();
    print_banner();

    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();

    ctrlc::set_handler(move || {
        println!("\n\n{}  Received SIGINT. Stopping tracker...", "⏹️".yellow());
        running_clone.store(false, Ordering::SeqCst);
    })
    .expect("Error setting Ctrl-C handler");

    let mut client = ApiClient::new();
    let mut state = TrackerState::new();

    // Send test message to Telegram if configured
    if telegram_enabled() {
        println!("{} Sending test message to Telegram...", "📱".cyan());
        match send_telegram_test().await {
            Ok(_) => println!("{} Telegram test successful! Check your chat.\n", "✅".green()),
            Err(e) => eprintln!("{} Telegram test failed: {}\n", "❌".red(), e),
        }
    }

    println!("{} Starting trade monitoring...\n", "🚀".green());

    while running.load(Ordering::SeqCst) {
        if let Err(e) = poll_trades(&mut client, &mut state).await {
            eprintln!("{} Poll error: {}", "❌".red(), e);
        }
        sleep(Duration::from_millis(poll_interval_ms())).await;
    }

    println!("\n{} Tracker stopped gracefully.", "👋".cyan());
    Ok(())
}

// ============================================================================
// POLLING
// ============================================================================

async fn poll_trades(client: &mut ApiClient, state: &mut TrackerState) -> anyhow::Result<()> {
    state.poll_count += 1;

    let trades = client.fetch_recent_trades(100).await?;

    // Filter out already processed trades
    let new_trades: Vec<_> = trades
        .into_iter()
        .filter(|t| !state.processed_trade_ids.contains(&t.unique_id()))
        .collect();

    // Add new trade IDs
    for trade in &new_trades {
        state.processed_trade_ids.insert(trade.unique_id());
    }

    // Limit set size
    if state.processed_trade_ids.len() > 10000 {
        let to_remove: Vec<_> = state.processed_trade_ids.iter().take(5000).cloned().collect();
        for id in to_remove {
            state.processed_trade_ids.remove(&id);
        }
    }

    let new_count = new_trades.len();

    // ========================================================================
    // FILTER CHAIN - Real insider detection
    // ========================================================================
    
    // FILTER 1: Exclude GAMBLING markets (crypto up/down, sports, hourly)
    let non_gambling: Vec<_> = new_trades
        .into_iter()
        .filter(|t| {
            let title = t.title.as_deref().unwrap_or("");
            !is_gambling_market(title)
        })
        .collect();
    let non_gambling_count = non_gambling.len();

    // FILTER 2: Large trades only ($5k+)
    let min_size = min_trade_size_usd();
    let large_trades: Vec<_> = non_gambling
        .into_iter()
        .filter(|t| t.value_usd() >= min_size)
        .collect();
    let large_count = large_trades.len();

    // FILTER 3: TAKER BUY only (aggressive)
    let aggressive_trades: Vec<_> = large_trades
        .into_iter()
        .filter(|t| t.is_taker_buy())
        .collect();

    // FILTER 4: CONTRARIAN odds (< 35%)
    let max_price = max_price_threshold();
    let contrarian_trades: Vec<_> = aggressive_trades
        .into_iter()
        .filter(|t| t.price < max_price)
        .collect();
    let contrarian_count = contrarian_trades.len();

    // Analyze contrarian trades for fresh wallet activity
    let mut suspects: Vec<SuspectTrade> = Vec::new();

    for trade in &contrarian_trades {
        if let Some(suspect) = analyze_trade(client, state, trade.clone()).await {
            suspects.push(suspect);
        }
    }

    // Log poll summary
    println!(
        "[POLL #{}] New: {} | Non-gambling: {} | Large(${:.0}k+): {} | Contrarian: {} | 🎯 INSIDERS: {}",
        state.poll_count,
        new_count,
        non_gambling_count,
        min_size / 1000.0,
        large_count,
        contrarian_count,
        suspects.len()
    );

    // Alert for each suspect
    for suspect in suspects {
        alert_suspect(&suspect);
    }

    Ok(())
}

// ============================================================================
// TRADE ANALYSIS
// ============================================================================

async fn analyze_trade(
    client: &mut ApiClient,
    state: &mut TrackerState,
    trade: Trade,
) -> Option<SuspectTrade> {
    let wallet_address = &trade.proxy_wallet;

    // Check cache
    let now = Instant::now();
    let user_stats = if let Some((cached, timestamp)) = state.user_stats_cache.get(wallet_address) {
        if now.duration_since(*timestamp).as_secs() < USER_CACHE_TTL_SECS {
            cached.clone()
        } else {
            let activities = client.fetch_user_activity(wallet_address).await.ok()?;
            let stats = ApiClient::calculate_user_stats(wallet_address, &activities);
            state.user_stats_cache.insert(wallet_address.clone(), (stats.clone(), now));
            stats
        }
    } else {
        let activities = client.fetch_user_activity(wallet_address).await.ok()?;
        let stats = ApiClient::calculate_user_stats(wallet_address, &activities);
        state.user_stats_cache.insert(wallet_address.clone(), (stats.clone(), now));
        stats
    };

    // Limit cache size
    if state.user_stats_cache.len() > 1000 {
        if let Some(key) = state.user_stats_cache.keys().next().cloned() {
            state.user_stats_cache.remove(&key);
        }
    }

    let max_markets = max_unique_markets();

    // Apply "sus" filter
    if user_stats.unique_markets <= max_markets {
        let value_usd = trade.value_usd();

        let mut reasons = vec![
            format!(
                "Fresh Wallet ({} lifetime market{})",
                user_stats.unique_markets,
                if user_stats.unique_markets == 1 { "" } else { "s" }
            ),
            "Taker BUY (aggressive)".to_string(),
        ];

        let alert_level = if user_stats.unique_markets <= 2 && value_usd >= 5000.0 {
            reasons.push(format!("Large Position (${:.0})", value_usd));
            AlertLevel::High
        } else if user_stats.unique_markets <= 1 {
            reasons.push("Brand New Wallet".to_string());
            AlertLevel::High
        } else if user_stats.unique_markets <= 3 {
            AlertLevel::Medium
        } else {
            AlertLevel::Low
        };

        let reason = reasons.join(" | ");

        return Some(SuspectTrade {
            trade,
            user_stats,
            reason,
            alert_level,
        });
    }

    None
}

// ============================================================================
// ALERTING
// ============================================================================

fn alert_suspect(suspect: &SuspectTrade) {
    let trade = &suspect.trade;
    let user_stats = &suspect.user_stats;

    let (emoji, level_colored) = match suspect.alert_level {
        AlertLevel::High => ("🚨", "HIGH".red().bold()),
        AlertLevel::Medium => ("⚠️", "MEDIUM".yellow().bold()),
        AlertLevel::Low => ("📊", "LOW".cyan()),
    };

    let divider = "═".repeat(65);
    let market_title = trade.title.as_deref().unwrap_or("Unknown Market");
    let outcome = trade.outcome.as_deref().unwrap_or(&trade.side);
    let masked_wallet = mask_address(&user_stats.address);
    let value_usd = trade.value_usd();
    let price_pct = trade.price * 100.0;
    let market_url = trade.market_url();
    
    // Format timestamp
    let timestamp = chrono::DateTime::from_timestamp(trade.timestamp, 0)
        .map(|dt| dt.format("%Y-%m-%d %H:%M:%S UTC").to_string())
        .unwrap_or_else(|| trade.timestamp.to_string());

    println!();
    println!("{}", divider.bright_white());
    println!("{} {} [{}] {}", emoji, "INSIDER ALERT".bold(), level_colored, emoji);
    println!("{}", divider.bright_white());
    println!("📈 Market:    {}", market_title.white().bold());
    println!("🎯 Outcome:   {}", outcome.green());
    println!("👛 Wallet:    {}", masked_wallet.cyan());
    println!("📝 Pseudonym: {}", trade.pseudonym.as_deref().unwrap_or("Anonymous"));
    println!("💰 Value:     ${:.2}", value_usd);
    println!("📊 Price:     {:.1}%", price_pct);
    println!("🔍 Reason:    {}", suspect.reason.yellow());
    println!("📅 Time:      {}", timestamp);
    println!("🔗 Tx:        {}", trade.transaction_hash.as_deref().unwrap_or("N/A"));
    println!();
    println!("🛒 {} {}", "BUY NOW:".green().bold(), market_url.underline());
    println!("{}", divider.bright_white());
    println!();

    // Telegram notification (PRIORITY)
    if telegram_enabled() {
        let suspect_clone = suspect.clone();
        tokio::spawn(async move {
            if let Err(e) = send_telegram_alert(&suspect_clone).await {
                eprintln!("{} Telegram alert failed: {}", "❌".red(), e);
            }
        });
    }

    // Discord webhook
    if let Some(webhook_url) = discord_webhook_url() {
        let suspect_clone = suspect.clone();
        tokio::spawn(async move {
            if let Err(e) = send_discord_alert(&webhook_url, &suspect_clone).await {
                eprintln!("{} Discord alert failed: {}", "❌".red(), e);
            }
        });
    }
}

async fn send_discord_alert(webhook_url: &str, suspect: &SuspectTrade) -> anyhow::Result<()> {
    let trade = &suspect.trade;
    let market_title = trade.title.as_deref().unwrap_or("Unknown Market");
    let market_url = trade.market_url();

    let color = match suspect.alert_level {
        AlertLevel::High => 0xFF0000,
        AlertLevel::Medium => 0xFFA500,
        AlertLevel::Low => 0x00FF00,
    };

    let embed = serde_json::json!({
        "embeds": [{
            "title": format!("{} Insider Alert [{}]", 
                if suspect.alert_level == AlertLevel::High { "🚨" } else { "⚠️" },
                suspect.alert_level
            ),
            "color": color,
            "fields": [
                { "name": "📈 Market", "value": market_title, "inline": false },
                { "name": "🎯 Outcome", "value": trade.outcome.as_deref().unwrap_or(&trade.side), "inline": true },
                { "name": "💰 Value", "value": format!("${:.2}", trade.value_usd()), "inline": true },
                { "name": "👛 Wallet", "value": mask_address(&suspect.user_stats.address), "inline": true },
                { "name": "📊 Lifetime Markets", "value": suspect.user_stats.unique_markets.to_string(), "inline": true },
                { "name": "🔍 Reason", "value": &suspect.reason, "inline": false },
                { "name": "🛒 Buy Link", "value": market_url, "inline": false }
            ]
        }]
    });

    reqwest::Client::new()
        .post(webhook_url)
        .json(&embed)
        .send()
        .await?;

    Ok(())
}

/// Send alert to Telegram
async fn send_telegram_alert(suspect: &SuspectTrade) -> anyhow::Result<()> {
    let token = telegram_bot_token().ok_or_else(|| anyhow::anyhow!("No Telegram token"))?;
    let chat_id = telegram_chat_id().ok_or_else(|| anyhow::anyhow!("No Telegram chat ID"))?;
    
    let trade = &suspect.trade;
    let market_title = trade.title.as_deref().unwrap_or("Unknown Market");
    let outcome = trade.outcome.as_deref().unwrap_or(&trade.side);
    let market_url = trade.market_url();
    let value_usd = trade.value_usd();
    let price_pct = trade.price * 100.0;
    
    let emoji = match suspect.alert_level {
        AlertLevel::High => "🚨",
        AlertLevel::Medium => "⚠️",
        AlertLevel::Low => "📊",
    };
    
    // Format timestamp
    let timestamp = chrono::DateTime::from_timestamp(trade.timestamp, 0)
        .map(|dt| dt.format("%H:%M:%S UTC").to_string())
        .unwrap_or_else(|| "Unknown".to_string());
    
    // Build Telegram message with HTML (more reliable than MarkdownV2)
    let message = format!(
        r#"{emoji} <b>INSIDER ALERT [{level}]</b> {emoji}

📈 <b>Market:</b> {title}
🎯 <b>Outcome:</b> {outcome}
💰 <b>Value:</b> ${value:.2}
📊 <b>Price:</b> {price:.1}%
👛 <b>Wallet:</b> <code>{wallet}</code>
🔍 <b>Reason:</b> {reason}
⏰ <b>Time:</b> {time}

🛒 <a href="{url}">BUY NOW</a>"#,
        emoji = emoji,
        level = suspect.alert_level,
        title = escape_html(market_title),
        outcome = escape_html(outcome),
        value = value_usd,
        price = price_pct,
        wallet = &suspect.user_stats.address,
        reason = escape_html(&suspect.reason),
        time = timestamp,
        url = market_url,
    );
    
    let url = format!("https://api.telegram.org/bot{}/sendMessage", token);
    
    let payload = serde_json::json!({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": false
    });
    
    let response = reqwest::Client::new()
        .post(&url)
        .json(&payload)
        .send()
        .await?;
    
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("Telegram API error: {}", error_text));
    }
    
    Ok(())
}

/// Escape special characters for Telegram HTML
fn escape_html(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// Send a test message to verify Telegram is configured correctly
async fn send_telegram_test() -> anyhow::Result<()> {
    let token = telegram_bot_token().ok_or_else(|| anyhow::anyhow!("No Telegram token"))?;
    let chat_id = telegram_chat_id().ok_or_else(|| anyhow::anyhow!("No Telegram chat ID"))?;
    
    // Use HTML parse mode - much easier to work with than MarkdownV2
    let message = r#"🎯 <b>Polymarket REAL Insider Tracker</b>

✅ Bot connected!

Monitoring for:
• Fresh wallets (≤2 prior markets)
• Large trades (&gt;$5,000)
• Contrarian bets (&lt;35% odds)
• Excluded: crypto up/down, sports, hourly

Alerts will appear here for REAL insider activity."#;
    
    let url = format!("https://api.telegram.org/bot{}/sendMessage", token);
    
    let payload = serde_json::json!({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    });
    
    let response = reqwest::Client::new()
        .post(&url)
        .json(&payload)
        .send()
        .await?;
    
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("Telegram API error: {}", error_text));
    }
    
    Ok(())
}

// ============================================================================
// BANNER
// ============================================================================

fn print_banner() {
    let min_size = min_trade_size_usd();
    let max_markets = max_unique_markets();
    let max_price = (max_price_threshold() * 100.0) as u32;
    let discord_enabled = discord_webhook_url().is_some();
    let tg_enabled = telegram_enabled();

    println!(
        r#"
╔═══════════════════════════════════════════════════════════════╗
║      {} POLYMARKET INSIDER TRACKER - REAL DETECTION {}       ║
╠═══════════════════════════════════════════════════════════════╣
║  Detecting REAL insider bets (NOT crypto gambling!)            ║
║                                                                ║
║  Filters:                                                      ║
║    × EXCLUDED: Crypto up/down, sports, hourly markets          ║
║    • Min Trade:     ${:<8.0} (real insider size)           ║
║    • Max Odds:      <{}% (contrarian bets)                   ║
║    • Fresh Wallet:  ≤{} prior markets                         ║
║    • Trade Type:    Taker BUY (aggressive)                     ║
║                                                                ║
║  Alerts: Telegram {} | Discord {}                     ║
╚═══════════════════════════════════════════════════════════════╝
"#,
        "🎯".red(),
        "🎯".red(),
        min_size,
        max_price,
        max_markets,
        if tg_enabled { "✓" } else { "✗" },
        if discord_enabled { "✓" } else { "✗" }
    );
}

