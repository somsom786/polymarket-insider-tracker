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
    pub first_activity_timestamp: Option<i64>,
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
