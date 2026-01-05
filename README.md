# Polymarket Insider Activity Tracker 🔍

Real-time monitoring tool that detects "insider" betting behavior on Polymarket by identifying fresh wallets placing large aggressive bets.

## Features

- 🦀 **High Performance** - Built in Rust for speed
- 📱 **Telegram Alerts** - Instant notifications with buy links
- 🎯 **Smart Detection** - Filters for fresh wallets + large taker BUYs
- 🔄 **Real-time** - Polls every 2 seconds

## Insider Detection Criteria

| Filter | Threshold |
|--------|-----------|
| Trade Size | > $1,000 USD |
| Trade Type | Taker BUY (aggressive) |
| Wallet Freshness | ≤ 5 lifetime markets |

## Quick Start

```bash
# Build
cargo build --release

# Configure Telegram (see below)
cp .env.example .env

# Run
cargo run --release
```

## Telegram Setup

1. Message **@BotFather** on Telegram → `/newbot`
2. Copy the bot token
3. Start a chat with your bot, send "hello"
4. Visit `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
5. Find your chat ID in the response

Add to `.env`:
```env
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MIN_TRADE_SIZE_USD` | 1000 | Min trade value |
| `MAX_UNIQUE_MARKETS` | 5 | Max markets for "fresh" |
| `POLL_INTERVAL_MS` | 2000 | Poll interval (ms) |

## Alert Example

```
🚨 INSIDER ALERT [HIGH] 🚨

📈 Market: Bitcoin $150k by March?
🎯 Outcome: Yes
💰 Value: $5,250.00
👛 Wallet: 0x31a...abc
🔍 Reason: Fresh Wallet (2 markets) | Taker BUY

🛒 BUY NOW: https://polymarket.com/event/...
```

## License

MIT
