'use client';

import { useState } from 'react';
import { Search, Command, Wallet, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
    currency: 'USD' | 'ETH';
    onCurrencyChange: (currency: 'USD' | 'ETH') => void;
}

export function Header({ currency, onCurrencyChange }: HeaderProps) {
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 px-6 backdrop-blur-md">
            {/* Search */}
            <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-muted)] transition-all hover:border-[var(--border-light)] hover:bg-[var(--surface-elevated)]"
            >
                <Search className="h-4 w-4" />
                <span>Search markets...</span>
                <div className="flex items-center gap-1 rounded border border-[var(--border-light)] bg-[var(--background)] px-1.5 py-0.5 text-xs">
                    <Command className="h-3 w-3" />
                    <span>K</span>
                </div>
            </button>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Currency Toggle */}
                <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
                    <button
                        onClick={() => onCurrencyChange('USD')}
                        className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                            currency === 'USD'
                                ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                        )}
                    >
                        USD
                    </button>
                    <button
                        onClick={() => onCurrencyChange('ETH')}
                        className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                            currency === 'ETH'
                                ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                        )}
                    >
                        ETH
                    </button>
                </div>

                {/* Network Selector */}
                <button className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)] transition-all hover:border-[var(--border-light)] hover:bg-[var(--surface-elevated)]">
                    <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    <span>Arbitrum</span>
                    <ChevronDown className="h-3 w-3" />
                </button>

                {/* Connect Wallet */}
                <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-green)] px-4 py-2 text-sm font-medium text-black transition-all hover:opacity-90">
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                </button>
            </div>

            {/* Search Modal Backdrop */}
            {searchOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSearchOpen(false)}
                >
                    <div
                        className="mx-auto mt-24 w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
                            <Search className="h-5 w-5 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search markets, tickers, addresses..."
                                className="flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-dim)]"
                                autoFocus
                            />
                            <button
                                onClick={() => setSearchOpen(false)}
                                className="rounded border border-[var(--border-light)] px-2 py-1 text-xs text-[var(--text-muted)]"
                            >
                                ESC
                            </button>
                        </div>
                        <div className="py-8 text-center text-sm text-[var(--text-dim)]">
                            Start typing to search...
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
