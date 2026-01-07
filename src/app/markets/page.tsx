'use client';

import { Header } from '@/components/header';
import { TickerLeaderboard } from '@/components/ticker-leaderboard';
import { useState } from 'react';

export default function MarketsPage() {
    const [currency, setCurrency] = useState<'USD' | 'ETH'>('USD');

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header currency={currency} onCurrencyChange={setCurrency} />

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Markets</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Live perpetual markets from Variational API
                    </p>
                </div>

                <TickerLeaderboard />
            </div>
        </div>
    );
}
