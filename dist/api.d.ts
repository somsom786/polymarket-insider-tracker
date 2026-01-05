import type { Trade, UserActivity, Market } from "./types.js";
/**
 * Fetch recent trades from the Data API
 * @param limit Number of trades to fetch (default 100)
 */
export declare function fetchRecentTrades(limit?: number): Promise<Trade[]>;
/**
 * Fetch user activity to determine unique markets traded
 * @param address Wallet address
 */
export declare function fetchUserActivity(address: string): Promise<UserActivity[]>;
/**
 * Calculate user stats from their activity
 */
export declare function calculateUserStats(address: string, activities: UserActivity[]): {
    uniqueMarkets: number;
    totalTrades: number;
};
/**
 * Fetch market details from Gamma API
 * @param conditionId The market condition ID
 */
export declare function fetchMarketDetails(conditionId: string): Promise<Market | null>;
/**
 * Mask wallet address for display (0x31a...)
 */
export declare function maskAddress(address: string): string;
/**
 * Calculate USD value of a trade
 * Polymarket shares are priced 0-1, representing cents
 * So price * size = USD value
 */
export declare function calculateTradeValue(trade: Trade): number;
