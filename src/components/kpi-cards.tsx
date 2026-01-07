'use client';

import { useMarketStats } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils';

interface KpiCardProps {
    title: string;
    value: string;
    loading?: boolean;
}

function KpiCard({ title, value, loading }: KpiCardProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 h-3 w-20 animate-pulse rounded bg-[var(--border)]" />
                <div className="h-7 w-28 animate-pulse rounded bg-[var(--border)]" />
            </div>
        );
    }

    return (
        <div className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--border-light)] hover:bg-[var(--surface-elevated)]">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                {title}
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
                {value}
            </div>
        </div>
    );
}

export function KpiCards() {
    const { data, isLoading } = useMarketStats();

    // Only show metrics that ACTUALLY exist in the API
    const cards = data
        ? [
            { title: 'Total Value Locked', value: formatCurrency(parseFloat(data.tvl)) },
            { title: '24h Volume', value: formatCurrency(parseFloat(data.total_volume_24h)) },
            { title: 'Open Interest', value: formatCurrency(parseFloat(data.open_interest)) },
            { title: 'Cumulative Volume', value: formatCurrency(parseFloat(data.cumulative_volume)) },
            { title: 'Markets', value: data.num_markets.toString() },
            { title: 'Loss Refund Pool', value: formatCurrency(parseFloat(data.loss_refund.pool_size)) },
        ]
        : Array(6).fill({ title: '', value: '' });

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {cards.map((card, index) => (
                <KpiCard
                    key={index}
                    title={card.title}
                    value={card.value}
                    loading={isLoading}
                />
            ))}
        </div>
    );
}
