# Variational Analytics Dashboard

A production-ready analytics dashboard for [Variational](https://variational.io/) — a generalized protocol for leveraged peer-to-peer derivatives trading.

Built with Next.js 16, styled like DefiLlama with high data density and a professional dark theme.

![Dashboard Overview](https://github.com/user-attachments/assets/placeholder.png)

## Features

- **Live API Data** — Fetches real-time metrics from `https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats`
- **487+ Markets** — View all perpetual markets with live prices, volumes, and funding rates
- **Protocol Metrics** — TVL, 24h Volume, Open Interest, Cumulative Volume, Loss Refund Pool
- **DefiLlama Aesthetic** — Dark theme, dense typography, professional data tables

## Pages

| Route | Description |
|-------|-------------|
| `/` | Overview with KPI cards, loss refunds, and markets table |
| `/markets` | Full markets listing with sortable columns |
| `/leaderboard` | Markets ranked by 24h trading volume |
| `/treasury` | Protocol reserves and loss refund pool info |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Data Fetching**: TanStack Query
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Reference

This dashboard consumes the Variational public API:

```
GET /metadata/stats
```

**Response fields:**
- `tvl` — Total Value Locked (USDC)
- `total_volume_24h` — 24h trading volume
- `open_interest` — Total open interest
- `cumulative_volume` — Lifetime trading volume
- `num_markets` — Number of listed markets
- `loss_refund.pool_size` — Refund pool balance
- `loss_refund.refunded_24h` — 24h refunds paid
- `listings[]` — Per-market data (ticker, mark_price, volume_24h, funding_rate, etc.)

See the [Variational API Docs](https://docs.variational.io/technical-documentation/api) for more details.

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Overview dashboard
│   ├── markets/page.tsx   # Markets listing
│   ├── leaderboard/page.tsx
│   ├── treasury/page.tsx
│   └── layout.tsx         # Root layout with sidebar
├── components/
│   ├── sidebar.tsx        # Navigation sidebar
│   ├── header.tsx         # Search, currency toggle, wallet
│   ├── kpi-cards.tsx      # Metric cards
│   ├── ticker-leaderboard.tsx  # Markets table
│   └── providers.tsx      # TanStack Query provider
└── lib/
    ├── api.ts             # API client
    ├── hooks.ts           # React Query hooks
    ├── types.ts           # TypeScript interfaces
    └── utils.ts           # Formatting helpers
```

## License

MIT
