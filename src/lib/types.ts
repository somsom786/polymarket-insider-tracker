// TypeScript interfaces matching the EXACT Variational API response structure
// Based on: https://docs.variational.io/technical-documentation/api

export interface Quote {
  bid: string;
  ask: string;
}

export interface QuoteSet {
  updated_at: string;
  size_1k: Quote;
  size_100k: Quote;
  size_1m?: Quote; // Only for majors (BTC, ETH, SOL)
}

export interface OpenInterest {
  long_open_interest: string;
  short_open_interest: string;
}

export interface Listing {
  ticker: string;
  name: string;
  mark_price: string;
  volume_24h: string;
  open_interest: OpenInterest;
  funding_rate: string;
  funding_interval_s: number;
  base_spread_bps: string;
  quotes: QuoteSet;
}

export interface LossRefund {
  pool_size: string;
  refunded_24h: string;
}

// This is the EXACT response from GET /metadata/stats
export interface MarketStats {
  total_volume_24h: string;
  cumulative_volume: string;
  tvl: string;
  open_interest: string;
  num_markets: number;
  loss_refund: LossRefund;
  listings: Listing[];
}
