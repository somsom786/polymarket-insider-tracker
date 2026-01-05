/**
 * Polymarket Insider Activity Tracker
 *
 * Monitors real-time trades on Polymarket to detect "suspicious" or "insider"
 * betting behavior by identifying fresh wallets placing large bets.
 *
 * Usage:
 *   npm run dev     # Development mode with ts-node
 *   npm run build   # Compile TypeScript
 *   npm start       # Run compiled JavaScript
 */
import axios from "axios";
import { MIN_TRADE_SIZE_USD, MAX_UNIQUE_MARKETS, POLL_INTERVAL_MS, DISCORD_WEBHOOK_URL, } from "./config.js";
import { fetchRecentTrades, fetchUserActivity, fetchMarketDetails, calculateUserStats, calculateTradeValue, maskAddress, } from "./api.js";
// ============================================================================
// STATE
// ============================================================================
/** Set of processed trade IDs for deduplication */
const processedTradeIds = new Set();
/** Cache for user stats to reduce API calls */
const userStatsCache = new Map();
const USER_CACHE_TTL_MS = 60000; // 1 minute
/** Cache for market details */
const marketCache = new Map();
/** Poll counter */
let pollCount = 0;
/** Running flag for graceful shutdown */
let isRunning = true;
// ============================================================================
// MAIN POLLING LOOP
// ============================================================================
async function pollTrades() {
    pollCount++;
    try {
        // Fetch recent trades
        const trades = await fetchRecentTrades(100);
        // Filter out already processed trades
        const newTrades = trades.filter((trade) => !processedTradeIds.has(trade.id));
        // Add new trade IDs to the processed set
        for (const trade of newTrades) {
            processedTradeIds.add(trade.id);
        }
        // Limit processed set size to prevent memory leaks
        if (processedTradeIds.size > 10000) {
            const toRemove = Array.from(processedTradeIds).slice(0, 5000);
            for (const id of toRemove) {
                processedTradeIds.delete(id);
            }
        }
        // Calculate USD value for each trade
        const tradesWithValue = newTrades.map((trade) => ({
            ...trade,
            valueUsd: calculateTradeValue(trade),
        }));
        // FILTER 1: Trades above minimum size ($1,000+)
        const largeTrades = tradesWithValue.filter((trade) => trade.valueUsd >= MIN_TRADE_SIZE_USD);
        // FILTER 2: Aggression - Only TAKER trades (market orders taking liquidity)
        // The 'owner' field is the taker (aggressive side)
        // We want BUY side = taking a bullish position aggressively
        const aggressiveTrades = largeTrades.filter((trade) => trade.side === "BUY" && trade.owner);
        // Analyze aggressive trades for suspicious activity
        const suspects = [];
        for (const trade of aggressiveTrades) {
            const suspect = await analyzeTrade(trade);
            if (suspect) {
                suspects.push(suspect);
            }
        }
        // Log poll summary with detailed breakdown
        console.log(`[POLL #${pollCount}] Trades: ${trades.length} | ` +
            `New: ${newTrades.length} | ` +
            `Large ($${MIN_TRADE_SIZE_USD}+): ${largeTrades.length} | ` +
            `Taker BUYs: ${aggressiveTrades.length} | ` +
            `🎯 Suspects: ${suspects.length}`);
        // Alert for each suspect
        for (const suspect of suspects) {
            await alertSuspect(suspect);
        }
    }
    catch (error) {
        console.error("❌ Poll error:", error);
    }
}
// ============================================================================
// TRADE ANALYSIS
// ============================================================================
/**
 * Analyze a trade for insider activity
 *
 * INSIDER CRITERIA:
 * 1. Freshness: Lifetime Unique Markets Traded <= 5
 * 2. High Conviction: Single Trade Value > $1,000 USD (pre-filtered)
 * 3. Aggression: TAKER BUY (market order taking liquidity) (pre-filtered)
 */
async function analyzeTrade(trade) {
    // The 'owner' is the TAKER (aggressive side taking liquidity)
    const walletAddress = trade.owner;
    if (!walletAddress) {
        return null;
    }
    // Check cache first
    const cachedStats = userStatsCache.get(walletAddress);
    const now = Date.now();
    let userStats;
    if (cachedStats && (now - cachedStats.timestamp) < USER_CACHE_TTL_MS) {
        userStats = cachedStats;
    }
    else {
        // Fetch user activity
        const activities = await fetchUserActivity(walletAddress);
        userStats = calculateUserStats(walletAddress, activities);
        // Cache the result
        userStatsCache.set(walletAddress, {
            ...userStats,
            timestamp: now,
        });
        // Limit cache size
        if (userStatsCache.size > 1000) {
            const oldestKey = userStatsCache.keys().next().value;
            if (oldestKey)
                userStatsCache.delete(oldestKey);
        }
    }
    // Apply the "sus" filter
    if (userStats.uniqueMarkets <= MAX_UNIQUE_MARKETS) {
        // This is a fresh wallet with a large trade - SUSPICIOUS!
        // Fetch market details
        let market = null;
        if (!marketCache.has(trade.market)) {
            market = await fetchMarketDetails(trade.market);
            marketCache.set(trade.market, market);
        }
        else {
            market = marketCache.get(trade.market) || null;
        }
        // Determine alert level based on conviction + freshness
        let alertLevel = "MEDIUM";
        const valueUsd = trade.valueUsd || 0;
        // Build reason string
        const reasons = [
            `Fresh Wallet (${userStats.uniqueMarkets} lifetime market${userStats.uniqueMarkets === 1 ? "" : "s"})`,
            `Taker BUY (aggressive)`,
        ];
        // HIGH: Very fresh (≤2 markets) AND large position ($5k+)
        if (userStats.uniqueMarkets <= 2 && valueUsd >= 5000) {
            alertLevel = "HIGH";
            reasons.push(`Large Position ($${valueUsd.toLocaleString()})`);
        }
        // HIGH: Brand new wallet (≤1 market) with any significant trade
        else if (userStats.uniqueMarkets <= 1) {
            alertLevel = "HIGH";
            reasons.push(`Brand New Wallet`);
        }
        // MEDIUM: Fresh wallet (≤3 markets)
        else if (userStats.uniqueMarkets <= 3) {
            alertLevel = "MEDIUM";
        }
        // LOW: Somewhat fresh (4-5 markets)
        else {
            alertLevel = "LOW";
        }
        const reason = reasons.join(" | ");
        return {
            trade,
            userStats: {
                address: walletAddress,
                uniqueMarkets: userStats.uniqueMarkets,
                totalTrades: userStats.totalTrades,
                activities: [],
            },
            market,
            reason,
            alertLevel,
        };
    }
    return null;
}
// ============================================================================
// ALERTING
// ============================================================================
async function alertSuspect(suspect) {
    const { trade, userStats, market, reason, alertLevel } = suspect;
    // Emoji based on alert level
    const emoji = alertLevel === "HIGH" ? "🚨" : alertLevel === "MEDIUM" ? "⚠️" : "📊";
    // Format the console alert
    const divider = "═".repeat(60);
    const marketTitle = market?.question || `Market ${trade.market.slice(0, 8)}...`;
    const outcome = trade.outcome || trade.side;
    const maskedWallet = maskAddress(userStats.address);
    const valueUsd = (trade.valueUsd || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    console.log(`\n${divider}`);
    console.log(`${emoji} INSIDER ALERT [${alertLevel}] ${emoji}`);
    console.log(divider);
    console.log(`📈 Market:    ${marketTitle}`);
    console.log(`🎯 Outcome:   ${outcome}`);
    console.log(`👛 Wallet:    ${maskedWallet}`);
    console.log(`💰 Value:     $${valueUsd}`);
    console.log(`📊 Price:     ${(parseFloat(trade.price) * 100).toFixed(1)}%`);
    console.log(`🔍 Reason:    ${reason}`);
    console.log(`📅 Time:      ${new Date(trade.match_time).toLocaleString()}`);
    console.log(`🔗 Tx:        ${trade.transaction_hash?.slice(0, 20)}...`);
    console.log(divider);
    console.log();
    // Send Discord webhook if configured
    if (DISCORD_WEBHOOK_URL) {
        await sendDiscordAlert(suspect);
    }
}
async function sendDiscordAlert(suspect) {
    const { trade, userStats, market, reason, alertLevel } = suspect;
    const marketTitle = market?.question || `Market ${trade.market.slice(0, 8)}...`;
    const outcome = trade.outcome || trade.side;
    const valueUsd = (trade.valueUsd || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    // Color based on alert level
    const color = alertLevel === "HIGH" ? 0xff0000 : alertLevel === "MEDIUM" ? 0xffa500 : 0x00ff00;
    const embed = {
        title: `${alertLevel === "HIGH" ? "🚨" : "⚠️"} Insider Alert [${alertLevel}]`,
        color,
        fields: [
            { name: "📈 Market", value: marketTitle, inline: false },
            { name: "🎯 Outcome", value: outcome, inline: true },
            { name: "💰 Value", value: `$${valueUsd}`, inline: true },
            { name: "👛 Wallet", value: maskAddress(userStats.address), inline: true },
            { name: "📊 Lifetime Markets", value: String(userStats.uniqueMarkets), inline: true },
            { name: "🔍 Reason", value: reason, inline: false },
        ],
        timestamp: new Date(trade.match_time).toISOString(),
    };
    try {
        await axios.post(DISCORD_WEBHOOK_URL, {
            embeds: [embed],
        });
    }
    catch (error) {
        console.error("❌ Failed to send Discord alert:", error);
    }
}
// ============================================================================
// STARTUP & SHUTDOWN
// ============================================================================
function printBanner() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         🔍 POLYMARKET INSIDER ACTIVITY TRACKER 🔍              ║
╠═══════════════════════════════════════════════════════════════╣
║  Monitoring for suspicious trading patterns...                 ║
║                                                                ║
║  Config:                                                       ║
║    • Min Trade Size:  $${MIN_TRADE_SIZE_USD.toLocaleString().padEnd(8)}                           ║
║    • Max Markets:     ${String(MAX_UNIQUE_MARKETS).padEnd(8)}                            ║
║    • Poll Interval:   ${(POLL_INTERVAL_MS / 1000).toFixed(1)}s                               ║
║    • Discord Alerts:  ${DISCORD_WEBHOOK_URL ? "Enabled ✓" : "Disabled ✗"}                           ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}
async function main() {
    printBanner();
    console.log("🚀 Starting trade monitoring...\n");
    // Initial poll
    await pollTrades();
    // Continue polling while running
    while (isRunning) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (isRunning) {
            await pollTrades();
        }
    }
    console.log("\n👋 Tracker stopped gracefully.");
}
// Handle graceful shutdown
process.on("SIGINT", () => {
    console.log("\n\n⏹️  Received SIGINT. Stopping tracker...");
    isRunning = false;
});
process.on("SIGTERM", () => {
    console.log("\n\n⏹️  Received SIGTERM. Stopping tracker...");
    isRunning = false;
});
// Start the tracker
main().catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
});
