'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { useMarketStats } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils';
import { Vault, DollarSign, Shield, BarChart3, Layers } from 'lucide-react';

export default function TreasuryPage() {
    const [currency, setCurrency] = useState<'USD' | 'ETH'>('USD');
    const { data, isLoading } = useMarketStats();

    // Only show metrics that ACTUALLY exist in the API
    const treasuryStats = data ? [
        {
            label: 'Total Value Locked',
            value: formatCurrency(parseFloat(data.tvl)),
            icon: Vault,
            color: 'var(--accent-cyan)',
        },
        {
            label: 'Open Interest',
            value: formatCurrency(parseFloat(data.open_interest)),
            icon: BarChart3,
            color: 'var(--accent-cyan)',
        },
        {
            label: 'Loss Refund Pool',
            value: formatCurrency(parseFloat(data.loss_refund.pool_size)),
            icon: Shield,
            color: 'var(--accent-green)',
        },
        {
            label: '24h Refunds Paid',
            value: formatCurrency(parseFloat(data.loss_refund.refunded_24h)),
            icon: DollarSign,
            color: 'var(--accent-yellow)',
        },
        {
            label: 'Listed Markets',
            value: data.num_markets.toString(),
            icon: Layers,
            color: 'var(--accent-cyan)',
        },
    ] : [];

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header currency={currency} onCurrencyChange={setCurrency} />

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Treasury</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Live protocol metrics from Variational API
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-32 animate-pulse rounded-xl bg-[var(--surface)]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {treasuryStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--border-light)]"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm text-[var(--text-muted)]">{stat.label}</span>
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${stat.color}20` }}
                                    >
                                        <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Protocol Info */}
                <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                    <h2 className="mb-4 text-lg font-semibold">About Variational</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-[var(--accent-cyan)]">Loss Refund Pool</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                                Every time a user closes a losing trade on Omni, they have between a 2% and 4% chance
                                to get the entire loss instantly refunded from this pool.
                            </p>
                        </div>
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-[var(--accent-green)]">Zero Fees</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                                Omni does not have trading fees. The only fees on the platform are a 0.1 USDC fee
                                for each deposit/withdraw to protect against spam.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
