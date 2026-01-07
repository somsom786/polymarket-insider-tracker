import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format large numbers with abbreviations
export function formatNumber(value: number, decimals: number = 2): string {
    if (value >= 1e9) {
        return `${(value / 1e9).toFixed(decimals)}B`;
    }
    if (value >= 1e6) {
        return `${(value / 1e6).toFixed(decimals)}M`;
    }
    if (value >= 1e3) {
        return `${(value / 1e3).toFixed(decimals)}K`;
    }
    return value.toFixed(decimals);
}

// Format currency with Intl.NumberFormat
export function formatCurrency(value: number, currency: string = 'USD'): string {
    if (Math.abs(value) >= 1e9) {
        return `$${(value / 1e9).toFixed(2)}B`;
    }
    if (Math.abs(value) >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1e3) {
        return `$${(value / 1e3).toFixed(2)}K`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

// Format percentage
export function formatPercentage(value: number, showSign: boolean = true): string {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

// Format crypto price (handles small decimals)
export function formatPrice(value: number): string {
    if (value === 0) return '$0.00';
    if (value < 0.0001) {
        return `$${value.toExponential(4)}`;
    }
    if (value < 1) {
        return `$${value.toFixed(6)}`;
    }
    if (value < 100) {
        return `$${value.toFixed(4)}`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

// Format funding rate
export function formatFundingRate(value: number): string {
    const percentage = value * 100;
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(4)}%`;
}

// Truncate address
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

// Format time duration
export function formatDuration(hours: number): string {
    if (hours < 1) {
        return `${Math.round(hours * 60)}m`;
    }
    if (hours < 24) {
        return `${hours.toFixed(1)}h`;
    }
    return `${(hours / 24).toFixed(1)}d`;
}
