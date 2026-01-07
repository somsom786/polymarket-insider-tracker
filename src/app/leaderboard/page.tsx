'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { useMarketStats } from '@/lib/hooks';
import { formatCurrency, formatFundingRate, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function LeaderboardPage() {
    const [currency, setCurrency] = useState<'USD' | 'ETH'>('USD');
    const { data, isLoading } = useMarketStats();

    // Sort listings by 24h volume (top performing markets)
    const sortedListings = data?.listings
        ? [...data.listings].sort((a, b) => parseFloat(b.volume_24h) - parseFloat(a.volume_24h))
        : [];

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header currency={currency} onCurrencyChange={setCurrency} />

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Market Leaderboard</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Markets ranked by 24h trading volume
                    </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array(10).fill(0).map((_, i) => (
                                <div key={i} className="h-16 animate-pulse rounded bg-[var(--border)]" />
                            ))}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border)]">
                                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Rank</th>
                                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Market</th>
                                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">24h Volume</th>
                                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Open Interest</th>
                                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Funding Rate</th>
                                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Spread (bps)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedListings.map((listing, index) => {
                                    const fundingRate = parseFloat(listing.funding_rate);
                                    const oi = parseFloat(listing.open_interest.long_open_interest) + parseFloat(listing.open_interest.short_open_interest);

                                    return (
                                        <tr
                                            key={listing.ticker}
                                            className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-elevated)]"
                                        >
                                            <td className="py-4">
                                                <div className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                                                    index === 0 && "bg-yellow-500/20 text-yellow-500",
                                                    index === 1 && "bg-gray-400/20 text-gray-400",
                                                    index === 2 && "bg-orange-500/20 text-orange-500",
                                                    index > 2 && "bg-[var(--surface-elevated)] text-[var(--text-muted)]"
                                                )}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div>
                                                    <span className="font-medium">{listing.ticker}</span>
                                                    <div className="text-xs text-[var(--text-dim)]">{listing.name}</div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="font-medium tabular-nums text-[var(--accent-cyan)]">
                                                    {formatCurrency(parseFloat(listing.volume_24h))}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="tabular-nums">{formatCurrency(oi)}</span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {fundingRate >= 0 ? (
                                                        <TrendingUp className="h-3 w-3 text-[var(--accent-green)]" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3 text-[var(--accent-red)]" />
                                                    )}
                                                    <span className={cn(
                                                        "tabular-nums",
                                                        fundingRate >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
                                                    )}>
                                                        {formatFundingRate(fundingRate)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="tabular-nums text-[var(--text-muted)]">
                                                    {parseFloat(listing.base_spread_bps).toFixed(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
