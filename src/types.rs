//! Type definitions for Polymarket API responses

use serde::{Deserialize, Serialize};

// ============================================================================
// TRADE TYPES (from Data API /trades endpoint)
// ============================================================================

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Trade {
    /// Wallet address (the trader)
    pub proxy_wallet: String,
    
    /// BUY or SELL
    pub side: String,
    
    /// Asset/Token ID
    #[serde(default)]
    pub asset: Option<String>,
    
    /// Condition ID (market identifier)
    #[serde(default)]
    pub condition_id: Option<String>,
    
    /// Number of shares
    pub size: f64,
    
    /// Price per share (0-1)
    pub price: f64,
    
    /// Unix timestamp
    pub timestamp: i64,
    
    /// Market title/question
    #[serde(default)]
    pub title: Option<String>,
    
    /// Market slug for URL
    #[serde(default)]
    pub slug: Option<String>,
    
    /// Market icon URL
    #[serde(default)]
    pub icon: Option<String>,
    
    /// Event slug for URL
    #[serde(default)]
    pub event_slug: Option<String>,
    
    /// Outcome (e.g., "Yes", "No", "Up", "Down")
    #[serde(default)]
    pub outcome: Option<String>,
    
    /// Outcome index
    #[serde(default)]
    pub outcome_index: Option<i32>,
    
    /// Trade name/ID
    #[serde(default)]
    pub name: Option<String>,
    
    /// User pseudonym
    #[serde(default)]
    pub pseudonym: Option<String>,
    
    /// User bio
    #[serde(default)]
    pub bio: Option<String>,
    
    /// Profile image URL
    #[serde(default)]
    pub profile_image: Option<String>,
    
    /// Optimized profile image URL
    #[serde(default)]
    pub profile_image_optimized: Option<String>,
    
    /// Transaction hash
    #[serde(default)]
    pub transaction_hash: Option<String>,
}

impl Trade {
    /// Calculate USD value of the trade
    pub fn value_usd(&self) -> f64 {
        self.price * self.size
    }

    /// Check if this is a taker BUY (aggressive)
    pub fn is_taker_buy(&self) -> bool {
        self.side.to_uppercase() == "BUY"
    }
    
    /// Get a unique ID for deduplication
    pub fn unique_id(&self) -> String {
        format!("{}-{}-{}", self.proxy_wallet, self.timestamp, self.size)
    }
    
    /// Get the Polymarket URL for this market
    pub fn market_url(&self) -> String {
        if let Some(slug) = &self.event_slug {
            format!("https://polymarket.com/event/{}", slug)
        } else if let Some(slug) = &self.slug {
            format!("https://polymarket.com/event/{}", slug)
        } else {
            "https://polymarket.com".to_string()
        }
    }
}

// ============================================================================
// ACTIVITY TYPES (from Data API /activity endpoint)
// ============================================================================

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserActivity {
    #[serde(default)]
    pub proxy_wallet: Option<String>,
    #[serde(default)]
    pub side: Option<String>,
    #[serde(default)]
    pub asset: Option<String>,
    #[serde(default)]
    pub condition_id: Option<String>,
    #[serde(default)]
    pub size: Option<f64>,
    #[serde(default)]
    pub price: Option<f64>,
    #[serde(default)]
    pub timestamp: Option<i64>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub slug: Option<String>,
    #[serde(default)]
    pub outcome: Option<String>,
    #[serde(default, rename = "type")]
    pub activity_type: Option<String>,
}

// ============================================================================
// USER STATS
// ============================================================================

#[derive(Debug, Clone)]
pub struct UserStats {
    pub address: String,
    pub unique_markets: usize,
    pub total_trades: usize,
}

// ============================================================================
// SUSPECT / ALERT TYPES
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AlertLevel {
    High,
    Medium,
    Low,
}

impl std::fmt::Display for AlertLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AlertLevel::High => write!(f, "HIGH"),
            AlertLevel::Medium => write!(f, "MEDIUM"),
            AlertLevel::Low => write!(f, "LOW"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct SuspectTrade {
    pub trade: Trade,
    pub user_stats: UserStats,
    pub reason: String,
    pub alert_level: AlertLevel,
}

// ============================================================================
// CLUSTER DETECTION (multiple fresh wallets same market)
// ============================================================================

use std::collections::HashSet;
use std::time::Instant;

#[derive(Debug, Clone)]
pub struct MarketCluster {
    pub condition_id: String,
    pub market_title: String,
    pub market_url: String,
    pub outcome: String,
    pub avg_price: f64,
    pub fresh_wallets: HashSet<String>,
    pub total_volume: f64,
    pub first_seen: Instant,
    pub last_trade: Trade,
}

impl MarketCluster {
    pub fn new(trade: &Trade) -> Self {
        let mut wallets = HashSet::new();
        wallets.insert(trade.proxy_wallet.clone());
        
        Self {
            condition_id: trade.condition_id.clone().unwrap_or_default(),
            market_title: trade.title.clone().unwrap_or_else(|| "Unknown".to_string()),
            market_url: trade.market_url(),
            outcome: trade.outcome.clone().unwrap_or_else(|| trade.side.clone()),
            avg_price: trade.price,
            fresh_wallets: wallets,
            total_volume: trade.value_usd(),
            first_seen: Instant::now(),
            last_trade: trade.clone(),
        }
    }
    
    pub fn add_trade(&mut self, trade: &Trade) {
        self.fresh_wallets.insert(trade.proxy_wallet.clone());
        self.total_volume += trade.value_usd();
        self.avg_price = (self.avg_price + trade.price) / 2.0;
        self.last_trade = trade.clone();
    }
    
    pub fn wallet_count(&self) -> usize {
        self.fresh_wallets.len()
    }
    
    pub fn age_minutes(&self) -> u64 {
        self.first_seen.elapsed().as_secs() / 60
    }
}

// ============================================================================
// VOLUME SPIKE DETECTION
// ============================================================================

use std::collections::VecDeque;

#[derive(Debug, Clone)]
pub struct VolumeTracker {
    pub condition_id: String,
    pub market_title: String,
    pub market_url: String,
    pub hourly_volumes: VecDeque<f64>,  // Last 24 hours
    pub current_hour_volume: f64,
    pub current_hour_start: Instant,
}

impl VolumeTracker {
    pub fn new(trade: &Trade) -> Self {
        Self {
            condition_id: trade.condition_id.clone().unwrap_or_default(),
            market_title: trade.title.clone().unwrap_or_else(|| "Unknown".to_string()),
            market_url: trade.market_url(),
            hourly_volumes: VecDeque::with_capacity(24),
            current_hour_volume: trade.value_usd(),
            current_hour_start: Instant::now(),
        }
    }
    
    pub fn add_trade(&mut self, trade: &Trade) {
        // Check if we need to roll to new hour
        if self.current_hour_start.elapsed().as_secs() >= 3600 {
            self.hourly_volumes.push_back(self.current_hour_volume);
            if self.hourly_volumes.len() > 24 {
                self.hourly_volumes.pop_front();
            }
            self.current_hour_volume = 0.0;
            self.current_hour_start = Instant::now();
        }
        
        self.current_hour_volume += trade.value_usd();
    }
    
    pub fn avg_hourly_volume(&self) -> f64 {
        if self.hourly_volumes.is_empty() {
            return 0.0;
        }
        self.hourly_volumes.iter().sum::<f64>() / self.hourly_volumes.len() as f64
    }
    
    pub fn is_spike(&self, multiplier: f64) -> bool {
        let avg = self.avg_hourly_volume();
        if avg < 100.0 {
            // Need at least $100 avg to detect spikes
            return false;
        }
        self.current_hour_volume > avg * multiplier
    }
    
    pub fn spike_ratio(&self) -> f64 {
        let avg = self.avg_hourly_volume();
        if avg < 1.0 { return 0.0; }
        self.current_hour_volume / avg
    }
}

