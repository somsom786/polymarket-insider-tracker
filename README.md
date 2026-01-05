# Polymarket Insider Tracker 🎯

Real-time detection of **REAL** insider trading on Polymarket - not gambling noise.

## What This Detects

| ✅ Alert | ❌ Ignored |
|----------|-----------|
| Fresh wallet + $5k+ bet | Bitcoin Up/Down markets |
| Contrarian odds (<35%) | Sports O/U bets |
| Political/corporate events | Hourly/15-min markets |
| 2 or fewer prior trades | Crypto price gambling |

## Quick Start

```bash
cargo build --release
cp .env.example .env  # Add your Telegram bot token
cargo run --release
```

## Detection Criteria

```
🎯 INSIDER ALERT triggers when:
  • Market is NOT gambling (crypto/sports/hourly excluded)
  • Position size ≥ $5,000
  • Wallet has ≤ 2 prior markets
  • Odds < 35% (contrarian bet)
  • Taker BUY order (aggressive)
```

## Configuration

```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

MIN_TRADE_SIZE_USD=5000     # Real insider size
MAX_UNIQUE_MARKETS=2        # Fresh wallet definition
MAX_PRICE_THRESHOLD=0.35    # Contrarian threshold
```

## Telegram Setup

1. Message **@BotFather** → `/newbot`
2. Copy the bot token to `.env`
3. Start chat with your bot, send "hello"
4. Get chat ID: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`

## Sample Output

```
[POLL #1] New: 100 | Non-gambling: 40 | Large($5k+): 2 | Contrarian: 0 | 🎯 INSIDERS: 0
```

## Why This Works

Based on research of real insider cases:
- **Maduro bet**: $630k from 3 new wallets hours before news
- **Nobel Prize**: Odds jumped 3.6% → 70% before announcement
- **Google leaks**: Exact launch dates bet before public knowledge

Real insiders bet **BIG** on **political/corporate events**, not $86 on Bitcoin hourly.

## License

MIT
