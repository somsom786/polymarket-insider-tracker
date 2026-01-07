'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    TrendingUp,
    Trophy,
    Vault,
    FileCode2,
    ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Markets', href: '/markets', icon: TrendingUp },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Treasury', href: '/treasury', icon: Vault },
];

const externalLinks = [
    { name: 'API Docs', href: 'https://docs.variational.io/technical-documentation/api', icon: FileCode2 },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-[var(--border)] bg-[var(--surface)]">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-[var(--border)] px-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-green)]">
                        <span className="text-sm font-bold text-black">V</span>
                    </div>
                    <span className="text-lg font-semibold tracking-tight">Variational</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-3">
                <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                    Dashboard
                </div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}

                <div className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                    Resources
                </div>
                {externalLinks.map((item) => (
                    <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
                    >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                        <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                    </a>
                ))}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
                    <div className="h-2 w-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
                    <span>All systems operational</span>
                </div>
            </div>
        </aside>
    );
}
