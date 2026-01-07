import type { MarketStats } from './types';

// Live Variational API endpoint
const API_BASE_URL = 'https://omni-client-api.prod.ap-northeast-1.variational.io';

export async function fetchMarketStats(): Promise<MarketStats> {
    const response = await fetch(`${API_BASE_URL}/metadata/stats`, {
        headers: {
            'Accept': 'application/json',
        },
        // Cache for 30 seconds
        next: { revalidate: 30 },
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}
