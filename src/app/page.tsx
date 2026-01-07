'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { KpiCards } from '@/components/kpi-cards';
import { TickerLeaderboard } from '@/components/ticker-leaderboard';
import { useMarketStats } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [currency, setCurrency] = useState<'USD' | 'ETH'>('USD');
  const { data } = useMarketStats();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currency={currency} onCurrencyChange={setCurrency} />

      <div className="p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Protocol Overview</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Live data from Variational&apos;s peer-to-peer derivatives protocol
          </p>
        </div>

        {/* KPI Cards - Only real API metrics */}
        <div className="mb-6">
          <KpiCards />
        </div>

        {/* Loss Refund Info */}
        {data && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="mb-3 text-sm font-medium">Loss Refunds (24h)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[var(--text-dim)]">Pool Size</div>
                <div className="text-lg font-semibold text-[var(--accent-green)]">
                  {formatCurrency(parseFloat(data.loss_refund.pool_size))}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-dim)]">Refunded (24h)</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(parseFloat(data.loss_refund.refunded_24h))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticker Leaderboard - Real API Data */}
        <TickerLeaderboard />
      </div>
    </div>
  );
}
