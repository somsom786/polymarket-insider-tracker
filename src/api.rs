//! API client for Polymarket endpoints

use anyhow::{Context, Result};
use reqwest::Client;
use std::collections::HashSet;
use std::time::Duration;
use tokio::time::sleep;

use crate::config::{DATA_API_BASE, INITIAL_BACKOFF_MS, MAX_BACKOFF_MS, BACKOFF_MULTIPLIER};
use crate::types::{Trade, UserActivity, UserStats};

/// HTTP client with retry logic
pub struct ApiClient {
    client: Client,
    current_backoff: u64,
}

impl ApiClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            current_backoff: INITIAL_BACKOFF_MS,
        }
    }

    /// Execute request with retry on rate limit
    async fn request_with_retry<T: serde::de::DeserializeOwned>(
        &mut self,
        url: &str,
        context: &str,
    ) -> Result<T> {
        loop {
            let response = self.client.get(url).send().await;

            match response {
                Ok(resp) => {
                    if resp.status() == 429 {
                        println!(
                            "⚠️  Rate limited on {}. Backing off for {}ms...",
                            context, self.current_backoff
                        );
                        sleep(Duration::from_millis(self.current_backoff)).await;
                        self.current_backoff = (self.current_backoff * BACKOFF_MULTIPLIER).min(MAX_BACKOFF_MS);
                        continue;
                    }

                    self.current_backoff = INITIAL_BACKOFF_MS;

                    let text = resp.text().await
                        .with_context(|| format!("Failed to get response text from {}", context))?;
                    
                    let data: T = serde_json::from_str(&text)
                        .with_context(|| {
                            let preview: String = text.chars().take(300).collect();
                            format!("JSON parse error from {}. Preview: {}", context, preview)
                        })?;
                    
                    return Ok(data);
                }
                Err(e) => {
                    return Err(anyhow::anyhow!("Request failed for {}: {}", context, e));
                }
            }
        }
    }

    /// Fetch recent trades from the Data API
    pub async fn fetch_recent_trades(&mut self, limit: usize) -> Result<Vec<Trade>> {
        let url = format!("{}/trades?limit={}", DATA_API_BASE, limit);
        self.request_with_retry(&url, "fetch_recent_trades").await
    }

    /// Fetch user activity to determine unique markets traded
    pub async fn fetch_user_activity(&mut self, address: &str) -> Result<Vec<UserActivity>> {
        let url = format!("{}/activity?user={}&limit=500", DATA_API_BASE, address);
        match self.request_with_retry(&url, &format!("activity({}...)", &address[..8.min(address.len())])).await {
            Ok(activities) => Ok(activities),
            Err(_) => Ok(vec![]),
        }
    }

    /// Calculate user stats from their activity
    pub fn calculate_user_stats(address: &str, activities: &[UserActivity]) -> UserStats {
        let mut unique_markets: HashSet<String> = HashSet::new();
        let mut total_trades = 0;
        let mut min_timestamp: Option<i64> = None;

        for activity in activities {
            // Track oldest activity
            if let Some(ts) = activity.timestamp {
                match min_timestamp {
                    Some(min) => if ts < min { min_timestamp = Some(ts) },
                    None => min_timestamp = Some(ts),
                }
            }

            // Count trades by checking if there's a condition_id and side
            if activity.side.is_some() {
                if let Some(cid) = &activity.condition_id {
                    unique_markets.insert(cid.clone());
                } else if let Some(slug) = &activity.slug {
                    unique_markets.insert(slug.clone());
                }
                total_trades += 1;
            }
        }

        UserStats {
            address: address.to_string(),
            unique_markets: unique_markets.len(),
            total_trades,
            first_activity_timestamp: min_timestamp,
        }
    }
}

/// Mask wallet address for display (0x31a...)
pub fn mask_address(address: &str) -> String {
    if address.len() < 10 {
        return address.to_string();
    }
    format!("{}...{}", &address[..6], &address[address.len()-4..])
}
