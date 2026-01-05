/**
 * Polymarket Insider Activity Tracker - Configuration
 */
import "dotenv/config";

// ============================================================================
// THRESHOLDS
// ============================================================================

/** Minimum trade size in USD to consider for analysis */
export const MIN_TRADE_SIZE_USD = parseInt(process.env.MIN_TRADE_SIZE_USD || "1000", 10);

/** Maximum unique markets a wallet can have traded to be considered "fresh" */
export const MAX_UNIQUE_MARKETS = parseInt(process.env.MAX_UNIQUE_MARKETS || "5", 10);

/** Polling interval in milliseconds */
export const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "2000", 10);

// ============================================================================
// API ENDPOINTS
// ============================================================================

/** Polymarket Data API base URL */
export const DATA_API_BASE = "https://data-api.polymarket.com";

/** Polymarket Gamma API base URL (for market metadata) */
export const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

/** Polymarket CLOB API base URL */
export const CLOB_API_BASE = "https://clob.polymarket.com";

// ============================================================================
// OPTIONAL INTEGRATIONS
// ============================================================================

/** Discord webhook URL for alerts (optional) */
export const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

// ============================================================================
// RATE LIMITING
// ============================================================================

/** Initial backoff delay in milliseconds when rate limited */
export const INITIAL_BACKOFF_MS = 1000;

/** Maximum backoff delay in milliseconds */
export const MAX_BACKOFF_MS = 60000;

/** Backoff multiplier */
export const BACKOFF_MULTIPLIER = 2;
