'use client';

import { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketStats } from '@/lib/hooks';
import { formatCurrency, formatPrice, formatFundingRate, cn } from '@/lib/utils';

type SortField = 'ticker' | 'volume_24h' | 'open_interest' | 'funding_rate' | 'mark_price';
type SortDirection = 'asc' | 'desc';

export function TickerLeaderboard() {
    const { data, isLoading } = useMarketStats();
    const [sortField, setSortField] = useState<SortField>('volume_24h');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedListings = data?.listings
        ? [...data.listings].sort((a, b) => {
            let aVal: number;
            let bVal: number;

            switch (sortField) {
                case 'ticker':
                    return sortDirection === 'asc'
                        ? a.ticker.localeCompare(b.ticker)
                        : b.ticker.localeCompare(a.ticker);
                case 'volume_24h':
                    aVal = parseFloat(a.volume_24h);
                    bVal = parseFloat(b.volume_24h);
                    break;
                case 'mark_price':
                    aVal = parseFloat(a.mark_price);
                    bVal = parseFloat(b.mark_price);
                    break;
                case 'open_interest':
                    aVal = parseFloat(a.open_interest.long_open_interest) + parseFloat(a.open_interest.short_open_interest);
                    bVal = parseFloat(b.open_interest.long_open_interest) + parseFloat(b.open_interest.short_open_interest);
                    break;
                case 'funding_rate':
                    aVal = parseFloat(a.funding_rate);
                    bVal = parseFloat(b.funding_rate);
                    break;
                default:
                    return 0;
            }

            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        })
        : [];

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(field)}
            className={cn(
                'flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors',
                sortField === field ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'
            )}
        >
            {children}
            <ArrowUpDown className="h-3 w-3" />
        </button>
    );

    if (isLoading) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-4 h-5 w-40 animate-pulse rounded bg-[var(--border)]" />
                <div className="space-y-3">
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded bg-[var(--border)]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium">All Markets ({data?.num_markets || 0})</h3>
                <div className="text-xs text-[var(--text-dim)]">
                    Live data from Variational API
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--border)]">
                            <th className="pb-3 text-left">
                                <SortButton field="ticker">Ticker</SortButton>
                            </th>
                            <th className="pb-3 text-right">
                                <SortButton field="mark_price">Mark Price</SortButton>
                            </th>
                            <th className="pb-3 text-right">
                                <SortButton field="volume_24h">24h Volume</SortButton>
                            </th>
                            <th className="pb-3 text-right">
                                <SortButton field="open_interest">Open Interest</SortButton>
                            </th>
                            <th className="pb-3 text-right">
                                <SortButton field="funding_rate">Funding Rate</SortButton>
                            </th>
                            <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                                Spread (bps)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedListings.map((listing) => {
                            const fundingRate = parseFloat(listing.funding_rate);
                            const oi = parseFloat(listing.open_interest.long_open_interest) + parseFloat(listing.open_interest.short_open_interest);
                            const markPrice = parseFloat(listing.mark_price);
                            const spreadBps = parseFloat(listing.base_spread_bps);

                            return (
                                <tr
                                    key={listing.ticker}
                                    className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-elevated)]"
                                >
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-green)]/20 text-xs font-bold text-[var(--accent-cyan)]">
                                                {listing.ticker.slice(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-medium">{listing.ticker}</div>
                                                <div className="text-xs text-[var(--text-dim)]">{listing.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="tabular-nums">{formatPrice(markPrice)}</span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="tabular-nums">{formatCurrency(parseFloat(listing.volume_24h))}</span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <div>
                                            <span className="tabular-nums">{formatCurrency(oi)}</span>
                                            <div className="text-xs text-[var(--text-dim)]">
                                                L: {formatCurrency(parseFloat(listing.open_interest.long_open_interest))} /
                                                S: {formatCurrency(parseFloat(listing.open_interest.short_open_interest))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span
                                            className={cn(
                                                'tabular-nums',
                                                fundingRate > 0
                                                    ? 'text-[var(--accent-green)]'
                                                    : fundingRate < 0
                                                        ? 'text-[var(--accent-red)]'
                                                        : 'text-[var(--text-muted)]'
                                            )}
                                        >
                                            {formatFundingRate(fundingRate)}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="tabular-nums text-[var(--text-muted)]">
                                            {spreadBps.toFixed(1)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
