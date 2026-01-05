//! Configuration constants for the Polymarket Insider Tracker

use std::env;

// ============================================================================
// INSIDER DETECTION THRESHOLDS
// ============================================================================

/// Minimum trade size in USD - Real insiders bet BIG ($5k+)
pub fn min_trade_size_usd() -> f64 {
    env::var("MIN_TRADE_SIZE_USD")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(5000.0)  // $5k minimum - real insider size
}

/// Maximum unique markets for "fresh" wallet - True insiders have 0-2 prior
pub fn max_unique_markets() -> usize {
    env::var("MAX_UNIQUE_MARKETS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(2)  // 0-2 prior markets = potential insider wallet
}

/// Maximum price (odds) - Only alert on contrarian bets
pub fn max_price_threshold() -> f64 {
    env::var("MAX_PRICE_THRESHOLD")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(0.35)  // < 35% odds = contrarian
}

/// Polling interval in milliseconds
pub fn poll_interval_ms() -> u64 {
    env::var("POLL_INTERVAL_MS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(2000)
}

// ============================================================================
// GAMBLING MARKET FILTER - Exclude noise markets
// ============================================================================

/// Keywords that indicate gambling markets (NOT insider territory)
pub const GAMBLING_KEYWORDS: &[&str] = &[
    "up or down",
    "up/down",
    "updown",
    "15m",
    "15 min",
    "30m", 
    "30 min",
    "hourly",
    "1 hour",
    "bitcoin up",
    "bitcoin down",
    "eth up",
    "eth down",
    "btc up",
    "btc down",
    "price above",
    "price below",
    "over/under",
    "o/u",
];

/// Check if a market title is a gambling market (should be filtered)
pub fn is_gambling_market(title: &str) -> bool {
    let lower = title.to_lowercase();
    GAMBLING_KEYWORDS.iter().any(|kw| lower.contains(kw))
}

// ============================================================================
// TELEGRAM / DISCORD
// ============================================================================

pub fn discord_webhook_url() -> Option<String> {
    env::var("DISCORD_WEBHOOK_URL").ok().filter(|s| !s.is_empty())
}

pub fn telegram_bot_token() -> Option<String> {
    env::var("TELEGRAM_BOT_TOKEN").ok().filter(|s| !s.is_empty())
}

pub fn telegram_chat_id() -> Option<String> {
    env::var("TELEGRAM_CHAT_ID").ok().filter(|s| !s.is_empty())
}

pub fn telegram_enabled() -> bool {
    telegram_bot_token().is_some() && telegram_chat_id().is_some()
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

pub const DATA_API_BASE: &str = "https://data-api.polymarket.com";

// Rate limiting
pub const INITIAL_BACKOFF_MS: u64 = 1000;
pub const MAX_BACKOFF_MS: u64 = 60000;
pub const BACKOFF_MULTIPLIER: u64 = 2;
