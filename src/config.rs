//! Configuration constants for the Polymarket Insider Tracker

use std::env;

/// Minimum trade size in USD to consider for analysis
pub fn min_trade_size_usd() -> f64 {
    env::var("MIN_TRADE_SIZE_USD")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(500.0)  // Lowered to catch more contrarian plays
}

/// Maximum unique markets a wallet can have traded to be considered "fresh"
pub fn max_unique_markets() -> usize {
    env::var("MAX_UNIQUE_MARKETS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(5)
}

/// Maximum price (odds) to consider - filter OUT high-odds "obvious" bets
/// Trades above this price are NOT insider activity, just gambling on the obvious
pub fn max_price_threshold() -> f64 {
    env::var("MAX_PRICE_THRESHOLD")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(0.30)  // Only alert on odds < 30% (contrarian/insider)
}

/// Polling interval in milliseconds
pub fn poll_interval_ms() -> u64 {
    env::var("POLL_INTERVAL_MS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(2000)
}

/// Discord webhook URL (optional)
pub fn discord_webhook_url() -> Option<String> {
    env::var("DISCORD_WEBHOOK_URL").ok().filter(|s| !s.is_empty())
}

/// Telegram Bot Token (optional)
pub fn telegram_bot_token() -> Option<String> {
    env::var("TELEGRAM_BOT_TOKEN").ok().filter(|s| !s.is_empty())
}

/// Telegram Chat ID (optional)
pub fn telegram_chat_id() -> Option<String> {
    env::var("TELEGRAM_CHAT_ID").ok().filter(|s| !s.is_empty())
}

/// Check if Telegram is configured
pub fn telegram_enabled() -> bool {
    telegram_bot_token().is_some() && telegram_chat_id().is_some()
}

// API Endpoints
pub const DATA_API_BASE: &str = "https://data-api.polymarket.com";
pub const GAMMA_API_BASE: &str = "https://gamma-api.polymarket.com";
pub const POLYMARKET_BASE_URL: &str = "https://polymarket.com";

// Rate limiting
pub const INITIAL_BACKOFF_MS: u64 = 1000;
pub const MAX_BACKOFF_MS: u64 = 60000;
pub const BACKOFF_MULTIPLIER: u64 = 2;
