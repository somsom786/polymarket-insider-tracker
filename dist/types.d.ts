/**
 * Polymarket Insider Activity Tracker - Type Definitions
 */
export interface Trade {
    id: string;
    taker_order_id: string;
    market: string;
    asset_id: string;
    side: "BUY" | "SELL";
    size: string;
    fee_rate_bps: string;
    price: string;
    status: string;
    match_time: string;
    last_update: string;
    outcome: string;
    bucket_index: number;
    owner: string;
    maker_address: string;
    transaction_hash: string;
    type: string;
    valueUsd?: number;
}
export interface UserActivity {
    id: string;
    user: string;
    market: string;
    asset_id: string;
    type: string;
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
export interface SuspectTrade {
    trade: Trade;
    userStats: UserStats;
    market: Market | null;
    reason: string;
    alertLevel: "HIGH" | "MEDIUM" | "LOW";
}
export interface TradesResponse {
    data: Trade[];
    next_cursor?: string;
}
export interface MarketsResponse {
    data: Market[];
}
