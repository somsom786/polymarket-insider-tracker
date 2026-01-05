# Polymarket Insider Activity Tracker 🔍

Real-time monitoring tool that detects insider betting behavior on Polymarket by identifying fresh wallets placing contrarian bets, coordinated cluster buying, and unusual volume spikes.

## Features

- 🦀 **High Performance** - Built in Rust
- 📱 **Telegram Alerts** - Instant notifications with buy links
- 🎯 **Contrarian Detection** - Fresh wallets betting on low-odds outcomes
- 👥 **Cluster Detection** - Multiple wallets entering same market
- 📊 **Volume Spike Detection** - Unusual activity on dormant markets

## Detection Criteria

| Alert Type | Trigger |
|------------|---------|
| 🎯 **Insider** | Fresh wallet (≤5 markets) + Taker BUY + Low odds (<30%) |
| 👥 **Cluster** | 3+ fresh wallets same market within 1 hour |
| 📊 **Volume Spike** | 5x normal hourly volume |

## Quick Start

```bash
# Build
cargo build --release

# Configure Telegram
cp .env.example .env
# Edit .env with your bot token and chat ID

# Run
cargo run --release
```

## Telegram Setup

1. Message **@BotFather** → `/newbot`
2. Copy the bot token
3. Start chat with your bot, send "hello"
4. Get chat ID: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`

## Configuration

```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# Detection thresholds
MIN_TRADE_SIZE_USD=500
MAX_PRICE_THRESHOLD=0.30      # Only alert on <30% odds
MAX_UNIQUE_MARKETS=5          # Fresh wallet definition
CLUSTER_MIN_WALLETS=3         # Min wallets for cluster
CLUSTER_WINDOW_MINS=60        # Cluster time window
VOLUME_SPIKE_MULTIPLIER=5.0   # 5x = spike
```

## Alert Examples

**Insider Alert:**
```
🚨 INSIDER ALERT [HIGH] 🚨
📈 Market: Will X happen by Y?
🎯 Outcome: Yes @ 12%
👛 Wallet: 0x1234...abcd
🔍 Reason: Fresh Wallet (2 markets) | Taker BUY
```

**Cluster Alert:**
```
👥 CLUSTER DETECTED 👥
📈 Market: Will Z happen?
👛 3 fresh wallets in 45 mins
💰 Combined: $4,500
```

**Volume Spike:**
```
📊 VOLUME SPIKE 📊
📈 Market: Event outcome
⚡ Volume: $25,000 (5x normal)
```

## License

MIT
