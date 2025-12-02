import type { WebSocketMessage, PriceUpdateData, PerpPair } from "./types";

export class PerpPriceWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private telegramId?: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private priceUpdateCallbacks: Map<string, Set<(data: PriceUpdateData) => void>> = new Map();
  private isConnecting = false;
  private isClosedManually = false;

  constructor(
    backendUrl = "wss://8988e8ca4a74.ngrok-free.app",
    telegramId?: string
  ) {
    // Convert HTTP URL to WebSocket URL if needed
    if (backendUrl.startsWith("http://")) {
      this.url = backendUrl.replace("http://", "ws://") + "/ws/prices";
    } else if (backendUrl.startsWith("https://")) {
      this.url = backendUrl.replace("https://", "wss://") + "/ws/prices";
    } else {
      this.url = backendUrl + "/ws/prices";
    }
    
    this.telegramId = telegramId;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error("Connection already in progress"));
        return;
      }

      this.isConnecting = true;
      this.isClosedManually = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("✅ Connected to perp price WebSocket");
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Authenticate if telegramId is provided
          if (this.telegramId) {
            this.send({
              type: "auth",
              telegramId: this.telegramId,
            });
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("🔌 WebSocket connection closed");
          this.isConnecting = false;

          // Auto-reconnect if not closed manually
          if (!this.isClosedManually && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
              this.connect().catch(console.error);
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Subscribe to price updates for specific pairs
   */
  subscribeToPairs(pairs: PerpPair[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected. Call connect() first.");
      return;
    }

    this.send({
      type: "subscribe",
      pairs,
    });
  }

  /**
   * Unsubscribe from price updates for specific pairs
   */
  unsubscribeFromPairs(pairs: PerpPair[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    this.send({
      type: "unsubscribe",
      pairs,
    });

    // Remove callbacks for these pairs
    pairs.forEach((pair) => {
      this.priceUpdateCallbacks.delete(pair);
    });
  }

  /**
   * Get current price for a pair (one-time fetch)
   */
  getPrice(pair: PerpPair): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    this.send({
      type: "get_price",
      pair,
    });
  }

  /**
   * Register a callback for price updates on a specific pair
   */
  onPriceUpdate(pair: PerpPair, callback: (data: PriceUpdateData) => void): void {
    if (!this.priceUpdateCallbacks.has(pair)) {
      this.priceUpdateCallbacks.set(pair, new Set());
    }

    this.priceUpdateCallbacks.get(pair)!.add(callback);
  }

  /**
   * Remove a price update callback
   */
  offPriceUpdate(pair: PerpPair, callback: (data: PriceUpdateData) => void): void {
    const callbacks = this.priceUpdateCallbacks.get(pair);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.priceUpdateCallbacks.delete(pair);
      }
    }
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    this.isClosedManually = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.priceUpdateCallbacks.clear();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message to the server
   */
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message: WebSocket not connected");
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      switch (message.type) {
        case "connected":
          console.log("📡 Connected:", message.message);
          console.log("📊 Supported pairs:", message.supportedPairs);
          break;

        case "subscribed":
          console.log("✅ Subscribed to pairs:", message.pairs);
          break;

        case "unsubscribed":
          console.log("❌ Unsubscribed from pairs:", message.pairs);
          break;

        case "price_update":
          if (message.pair && message.data) {
            this.notifyPriceUpdate(message.pair, message.data);
          }
          break;

        case "price":
          if (message.pair && message.data) {
            console.log(`💰 Price for ${message.pair}:`, message.data);
            this.notifyPriceUpdate(message.pair, message.data);
          }
          break;

        case "error":
          console.error("🚨 WebSocket error:", message.message);
          break;

        default:
          console.warn("Unknown message type:", message);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  /**
   * Notify all registered callbacks for a pair's price update
   */
  private notifyPriceUpdate(pair: string, data: PriceUpdateData): void {
    const callbacks = this.priceUpdateCallbacks.get(pair);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in price update callback for ${pair}:`, error);
        }
      });
    }
  }
}

/**
 * Usage Example:
 * 
 * ```typescript
 * const priceWs = new PerpPriceWebSocket(
 *   "wss://your-backend.com",
 *   "123456789"
 * );
 * 
 * // Connect
 * await priceWs.connect();
 * 
 * // Subscribe to price updates
 * priceWs.subscribeToPairs(["BTC/USD", "ETH/USD"]);
 * 
 * // Register callback for BTC price updates
 * priceWs.onPriceUpdate("BTC/USD", (data) => {
 *   console.log("BTC Price:", data.price);
 *   console.log("Timestamp:", data.timestamp);
 * });
 * 
 * // Get one-time price
 * priceWs.getPrice("SOL/USD");
 * 
 * // Unsubscribe and close
 * priceWs.unsubscribeFromPairs(["BTC/USD"]);
 * priceWs.close();
 * ```
 */