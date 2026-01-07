'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMarketStats } from './api';

export function useMarketStats() {
    return useQuery({
        queryKey: ['marketStats'],
        queryFn: fetchMarketStats,
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refetch every minute
    });
}
