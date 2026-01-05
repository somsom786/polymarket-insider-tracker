/**
 * Polymarket Insider Activity Tracker - Type Definitions
 */

// ============================================================================
// TRADE TYPES (from Data API /trades endpoint)
// ============================================================================

export interface Trade {
    id: string;
    taker_order_id: string;
    market: string;           // Condition ID
    asset_id: string;         // Token ID
    side: "BUY" | "SELL";
    size: string;             // Amount of shares
    fee_rate_bps: string;
    price: string;            // Price per share (0-1)
    status: string;
    match_time: string;       // ISO timestamp
    last_update: string;
    outcome: string;          // "Yes" or "No"
    bucket_index: number;
    owner: string;            // Wallet address
    maker_address: string;
    transaction_hash: string;
    type: string;

    // Calculated field (we add this)
    valueUsd?: number;
}

// ============================================================================
// ACTIVITY TYPES (from Data API /activity endpoint)
// ============================================================================

export interface UserActivity {
    id: string;
    user: string;
    market: string;           // Condition ID
    asset_id: string;
    type: string;             // "trade", "deposit", etc.
    side?: "BUY" | "SELL";
    size?: string;
    price?: string;
    timestamp: string;
    transaction_hash: string;
}

export interface UserStats {
    address: string;
    uniqueMarkets: number;
    totalTrades: number;
    activities: UserActivity[];
}

// ============================================================================
// MARKET TYPES (from Gamma API)
// ============================================================================

export interface Market {
    id: string;
    question: string;
    conditionId: string;
    slug: string;
    description: string;
    endDate: string;
    outcomes: string[];
    outcomePrices: string[];
    volume: string;
    volume24hr: string;
    active: boolean;
    closed: boolean;
    marketMakerAddress: string;
    tokens: MarketToken[];
}

export interface MarketToken {
    token_id: string;
    outcome: string;
    price: number;
    winner: boolean;
}

// ============================================================================
// SUSPECT / ALERT TYPES
// ============================================================================

export interface SuspectTrade {
    trade: Trade;
    userStats: UserStats;
    market: Market | null;
    reason: string;
    alertLevel: "HIGH" | "MEDIUM" | "LOW";
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface TradesResponse {
    data: Trade[];
    next_cursor?: string;
}

export interface MarketsResponse {
    data: Market[];
}
