/**
 * Polymarket Insider Activity Tracker - API Client
 */
import axios from "axios";
import { DATA_API_BASE, GAMMA_API_BASE, INITIAL_BACKOFF_MS, MAX_BACKOFF_MS, BACKOFF_MULTIPLIER, } from "./config.js";
// ============================================================================
// RATE LIMITING & RETRY LOGIC
// ============================================================================
let currentBackoff = INITIAL_BACKOFF_MS;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withRetry(fn, context) {
    try {
        const result = await fn();
        currentBackoff = INITIAL_BACKOFF_MS; // Reset on success
        return result;
    }
    catch (error) {
        const axiosError = error;
        if (axiosError.response?.status === 429) {
            console.log(`⚠️  Rate limited on ${context}. Backing off for ${currentBackoff}ms...`);
            await sleep(currentBackoff);
            currentBackoff = Math.min(currentBackoff * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
            return withRetry(fn, context); // Retry
        }
        console.error(`❌ API Error [${context}]:`, axiosError.message || error);
        return null;
    }
}
// ============================================================================
// TRADE FETCHING (Data API)
// ============================================================================
/**
 * Fetch recent trades from the Data API
 * @param limit Number of trades to fetch (default 100)
 */
export async function fetchRecentTrades(limit = 100) {
    const result = await withRetry(async () => {
        const response = await axios.get(`${DATA_API_BASE}/trades`, {
            params: { limit },
            timeout: 10000,
        });
        return response.data;
    }, "fetchRecentTrades");
    return result || [];
}
// ============================================================================
// USER ACTIVITY (Data API)
// ============================================================================
/**
 * Fetch user activity to determine unique markets traded
 * @param address Wallet address
 */
export async function fetchUserActivity(address) {
    const result = await withRetry(async () => {
        const response = await axios.get(`${DATA_API_BASE}/activity`, {
            params: {
                user: address,
                limit: 500 // Get enough history to count unique markets
            },
            timeout: 10000,
        });
        return response.data;
    }, `fetchUserActivity(${maskAddress(address)})`);
    return result || [];
}
/**
 * Calculate user stats from their activity
 */
export function calculateUserStats(address, activities) {
    const uniqueMarkets = new Set();
    let totalTrades = 0;
    for (const activity of activities) {
        if (activity.type === "trade" || activity.side) {
            uniqueMarkets.add(activity.market);
            totalTrades++;
        }
    }
    return {
        uniqueMarkets: uniqueMarkets.size,
        totalTrades,
    };
}
// ============================================================================
// MARKET DETAILS (Gamma API)
// ============================================================================
/**
 * Fetch market details from Gamma API
 * @param conditionId The market condition ID
 */
export async function fetchMarketDetails(conditionId) {
    const result = await withRetry(async () => {
        const response = await axios.get(`${GAMMA_API_BASE}/markets`, {
            params: { condition_id: conditionId },
            timeout: 10000,
        });
        return response.data[0] || null;
    }, `fetchMarketDetails(${conditionId.slice(0, 8)}...)`);
    return result;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Mask wallet address for display (0x31a...)
 */
export function maskAddress(address) {
    if (!address || address.length < 10)
        return address;
    return `${address.slice(0, 5)}...${address.slice(-3)}`;
}
/**
 * Calculate USD value of a trade
 * Polymarket shares are priced 0-1, representing cents
 * So price * size = USD value
 */
export function calculateTradeValue(trade) {
    const price = parseFloat(trade.price) || 0;
    const size = parseFloat(trade.size) || 0;
    return price * size;
}
