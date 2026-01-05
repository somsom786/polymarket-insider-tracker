/**
 * Polymarket Insider Activity Tracker - Configuration
 */
import "dotenv/config";
/** Minimum trade size in USD to consider for analysis */
export declare const MIN_TRADE_SIZE_USD: number;
/** Maximum unique markets a wallet can have traded to be considered "fresh" */
export declare const MAX_UNIQUE_MARKETS: number;
/** Polling interval in milliseconds */
export declare const POLL_INTERVAL_MS: number;
/** Polymarket Data API base URL */
export declare const DATA_API_BASE = "https://data-api.polymarket.com";
/** Polymarket Gamma API base URL (for market metadata) */
export declare const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
/** Polymarket CLOB API base URL */
export declare const CLOB_API_BASE = "https://clob.polymarket.com";
/** Discord webhook URL for alerts (optional) */
export declare const DISCORD_WEBHOOK_URL: string;
/** Initial backoff delay in milliseconds when rate limited */
export declare const INITIAL_BACKOFF_MS = 1000;
/** Maximum backoff delay in milliseconds */
export declare const MAX_BACKOFF_MS = 60000;
/** Backoff multiplier */
export declare const BACKOFF_MULTIPLIER = 2;
