import type {
  Chain,
  Balance,
  Position,
  UserProfile,
  WalletAddress,
  TokenDetails,
  BuyResponse,
  SellResponse,
  DemoBalance,
  PerpPosition,
  OpenPerpPositionResponse,
  ClosePerpPositionResponse,
  PerpTradingStats,
  TradingPair,
  PairPriceData,
  PairSnapshot,
  MarketSnapshot
} from "./types";

// Trading Pair Types
export class MiniAppClient {
  private telegramId: string;
  private backendUrl: string;
  private ws: WebSocket | null = null;
  private priceSubscriptions: Map<string, Set<(data: PairPriceData) => void>> = new Map();
  private pairsCache: Map<string, TradingPair> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(
    telegramId: string,
    initData: string,
    backendUrl = "https://delcie-unvariant-unlimitedly.ngrok-free.dev"
  ) {
    this.telegramId = telegramId;
    this.backendUrl = backendUrl;
  }

  getTelegramId(): string {
    return this.telegramId;
  }

  private getHeaders(): Record<string, string> {
    return {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

  // ============================================
  // TRADING PAIRS - NEW FUNCTIONALITY
  // ============================================

  /**
   * Get all available trading pairs
   * @param forceRefresh - Force refresh from backend (bypass cache)
   * @returns Array of available trading pairs
   */
  async getAvailablePairs(forceRefresh: boolean = false): Promise<TradingPair[]> {
    try {
      // Check cache first
      if (!forceRefresh && this.pairsCache && (Date.now() - this.cacheTimestamp) < this.CACHE_TTL) {
        return Array.from(this.pairsCache.values());
      }

      const res = await fetch(`${this.backendUrl}/api/perp/pairs`, {
        headers: this.getHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      
      // Update cache
      this.pairsCache = new Map();
      data.pairs.forEach((pair: TradingPair) => {
        this.pairsCache!.set(pair.pair, pair);
      });
      this.cacheTimestamp = Date.now();

      return data.pairs;
    } catch (error) {
      console.error("getAvailablePairs error:", error);
      throw error;
    }
  }

  /**
   * Get specific pair details
   * @param pairName - Pair name (e.g., "BTC/USD")
   * @returns Trading pair details
   */
  async getPairDetails(pairName: string): Promise<TradingPair> {
    try {
      // Check cache first
      if (this.pairsCache && this.pairsCache.has(pairName)) {
        const cachedPair = this.pairsCache.get(pairName);
        if (cachedPair && (Date.now() - this.cacheTimestamp) < this.CACHE_TTL) {
          return cachedPair;
        }
      }

      const res = await fetch(`${this.backendUrl}/api/perp/pairs/${pairName}`, {
        headers: this.getHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      
      // Update cache
      if (!this.pairsCache) {
        this.pairsCache = new Map();
      }
      this.pairsCache.set(pairName, data.pair);

      return data.pair;
    } catch (error) {
      console.error(`getPairDetails error for ${pairName}:`, error);
      throw error;
    }
  }

  /**
   * Get current price for a trading pair
   * @param pairName - Pair name (e.g., "BTC/USD")
   * @returns Current price data
   */
  async getPairPrice(pairName: string): Promise<PairPriceData> {
    try {
      const res = await fetch(`${this.backendUrl}/api/perp/price/${pairName}`, {
        headers: this.getHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return await res.json();
    } catch (error) {
      console.error(`getPairPrice error for ${pairName}:`, error);
      throw error;
    }
  }

  /**
   * Get prices for multiple pairs at once
   * @param pairNames - Array of pair names
   * @returns Array of price data
   */
  async getMultiplePairPrices(pairNames: string[]): Promise<PairPriceData[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/perp/prices`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ pairs: pairNames }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return data.prices;
    } catch (error) {
      console.error("getMultiplePairPrices error:", error);
      throw error;
    }
  }

  /**
   * Get complete market snapshot (all pairs with prices)
   * @returns Complete market snapshot
   */
  async getMarketSnapshot(): Promise<MarketSnapshot> {
    try {
      const res = await fetch(`${this.backendUrl}/api/perp/snapshot`, {
        headers: this.getHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      
      // Convert to Map for easier access
      const pairsMap = new Map<string, TradingPair>();
      data.pairs.forEach((pair: TradingPair) => {
        pairsMap.set(pair.pair, pair);
      });

      // Update cache
      this.pairsCache = pairsMap;
      this.cacheTimestamp = data.timestamp;

      return {
        pairs: pairsMap,
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error("getMarketSnapshot error:", error);
      throw error;
    }
  }

  /**
   * Get snapshot for a specific pair (includes price + market data)
   * @param pairName - Pair name
   * @returns Pair snapshot
   */
  async getPairSnapshot(pairName: string): Promise<PairSnapshot> {
    try {
      const [priceData, marketData] = await Promise.all([
        this.getPairPrice(pairName),
        this.getPairDetails(pairName),
      ]);

      return {
        pair: pairName,
        priceData,
        marketData,
      };
    } catch (error) {
      console.error(`getPairSnapshot error for ${pairName}:`, error);
      throw error;
    }
  }

  /**
   * Search/filter pairs by criteria
   * @param filter - Filter criteria
   * @returns Filtered pairs
   */
  async searchPairs(filter: {
    from?: string;
    to?: string;
    minLeverage?: number;
    maxLeverage?: number;
    groupIndex?: number;
  }): Promise<TradingPair[]> {
    const allPairs = await this.getAvailablePairs();

    return allPairs.filter((pair) => {
      if (filter.from && !pair.from.toLowerCase().includes(filter.from.toLowerCase())) {
        return false;
      }
      if (filter.to && !pair.to.toLowerCase().includes(filter.to.toLowerCase())) {
        return false;
      }
      if (filter.minLeverage && pair.maxLeverage < filter.minLeverage) {
        return false;
      }
      if (filter.maxLeverage && pair.maxLeverage > filter.maxLeverage) {
        return false;
      }
      if (filter.groupIndex !== undefined && pair.groupIndex !== filter.groupIndex) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get pairs by group index
   * @param groupIndex - Group index
   * @returns Pairs in the group
   */
  async getPairsByGroup(groupIndex: number): Promise<TradingPair[]> {
    return this.searchPairs({ groupIndex });
  }

  // ============================================
  // WEBSOCKET PRICE STREAMING
  // ============================================

  /**
   * Connect to WebSocket for real-time price updates
   */
  connectWebSocket(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    const wsUrl = this.backendUrl.replace(/^https?/, "ws") + "/ws/prices";
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("✅ Connected to price feed WebSocket");
      
      // Re-subscribe to all pairs if reconnecting
      if (this.priceSubscriptions.size > 0) {
        const pairs = Array.from(this.priceSubscriptions.keys());
        this.ws?.send(JSON.stringify({
          type: "subscribe",
          pairs,
        }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "price_update") {
          const { pair, data } = message;
          const callbacks = this.priceSubscriptions.get(pair);
          
          if (callbacks) {
            callbacks.forEach((callback) => {
              try {
                callback(data);
              } catch (error) {
                console.error("Error in price callback:", error);
              }
            });
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("⚠️ WebSocket closed, reconnecting in 5s...");
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }

  /**
   * Subscribe to real-time price updates for a pair
   * @param pairName - Pair name
   * @param callback - Callback function to receive price updates
   */
  subscribeToPairPrice(
    pairName: string,
    callback: (data: PairPriceData) => void
  ): void {
    // Add callback to subscriptions
    if (!this.priceSubscriptions.has(pairName)) {
      this.priceSubscriptions.set(pairName, new Set());
    }
    this.priceSubscriptions.get(pairName)!.add(callback);

    // Ensure WebSocket is connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket();
    }

    // Send subscribe message
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "subscribe",
        pairs: [pairName],
      }));
    }
  }

  /**
   * Unsubscribe from price updates
   * @param pairName - Pair name
   * @param callback - Callback to remove (optional, removes all if not provided)
   */
  unsubscribeFromPairPrice(
    pairName: string,
    callback?: (data: PairPriceData) => void
  ): void {
    const callbacks = this.priceSubscriptions.get(pairName);

    if (!callbacks) return;

    if (callback) {
      callbacks.delete(callback);
    } else {
      callbacks.clear();
    }

    // If no more callbacks, unsubscribe from WebSocket
    if (callbacks.size === 0) {
      this.priceSubscriptions.delete(pairName);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: "unsubscribe",
          pairs: [pairName],
        }));
      }
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.priceSubscriptions.clear();
  }

  // ============================================
  // UTILITY METHODS FOR PAIRS
  // ============================================

  /**
   * Format pair price with appropriate decimals
   */
  formatPairPrice(price: number, pairName: string): string {
    if (pairName.startsWith("BTC") || pairName.startsWith("ETH")) {
      return `$${price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if (
      pairName.startsWith("SOL") ||
      pairName.startsWith("BNB") ||
      pairName.startsWith("AVAX") ||
      pairName.startsWith("LINK")
    ) {
      return `$${price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })}`;
    }

    return `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    })}`;
  }

  /**
   * Calculate liquidation price for a position
   */
  calculateLiquidationPrice(
    entryPrice: number,
    leverage: number,
    isLong: boolean
  ): number {
    if (isLong) {
      return entryPrice * (1 - 1 / leverage);
    } else {
      return entryPrice * (1 + 1 / leverage);
    }
  }

  /**
   * Calculate position size from collateral and leverage
   */
  calculatePositionSize(collateral: number, leverage: number): number {
    return collateral * leverage;
  }

  /**
   * Clear pairs cache
   */
  clearPairsCache(): void {
    this.pairsCache = null;
    this.cacheTimestamp = 0;
  }

  // ============================================
  // ORIGINAL METHODS (keeping all existing functionality)
  // ============================================

  async getUserProfile(): Promise<UserProfile> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/user/${this.telegramId}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("getUserProfile error:", error);
      throw error;
    }
  }

  async getAvailableChains(): Promise<Chain[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/chains`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.chains;
    } catch (error) {
      console.error("getAvailableChains error:", error);
      throw error;
    }
  }

  async getBalance(chain: string): Promise<Balance> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/balance/${this.telegramId}/${chain}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`getBalance error for ${chain}:`, error);
      throw error;
    }
  }

  async getTokenBalance(chain: string, tokenAddress: string): Promise<Balance> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/balance/${this.telegramId}/${chain}/${tokenAddress}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(
        `getTokenBalance error for ${tokenAddress} on ${chain}:`,
        error
      );
      throw error;
    }
  }

  async getWalletAddress(chain: string): Promise<WalletAddress> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/wallet/${this.telegramId}/${chain}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`getWalletAddress error for ${chain}:`, error);
      throw error;
    }
  }

  async getAllPositions(): Promise<Position[]> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/positions/${this.telegramId}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.positions;
    } catch (error) {
      console.error("getAllPositions error:", error);
      throw error;
    }
  }

  async getPositionsByChain(chain: string): Promise<Position[]> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/positions/${this.telegramId}/chain/${chain}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.positions;
    } catch (error) {
      console.error(`getPositionsByChain error for ${chain}:`, error);
      throw error;
    }
  }

  async getActiveCompetitionPositions(): Promise<Position[]> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/positions/${this.telegramId}/active-competition`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.positions;
    } catch (error) {
      console.error("getActiveCompetitionPositions error:", error);
      throw error;
    }
  }

  async getTokenDetails(
    chain: string,
    contractAddress: string
  ): Promise<TokenDetails> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/token/${chain}/${contractAddress}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(
        `getTokenDetails error for ${contractAddress} on ${chain}:`,
        error
      );
      throw error;
    }
  }

  async buyToken(
    chain: string,
    tokenAddress: string,
    amountInNative: number,
    slippage = 1
  ): Promise<BuyResponse> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/trade/buy/${this.telegramId}/${chain}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            tokenAddress,
            amountInNative,
            slippage,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          tokenAddress,
          amountInNative,
        };
      }

      return data;
    } catch (error) {
      console.error(`buyToken error for ${tokenAddress} on ${chain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        tokenAddress,
        amountInNative,
      };
    }
  }

  async sellToken(
    chain: string,
    tokenAddress: string,
    percentToSell: number,
    slippage = 0.5
  ): Promise<SellResponse> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/trade/sell/${this.telegramId}/${chain}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            tokenAddress,
            percentToSell,
            slippage,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          tokenAddress,
          percentToSell,
        };
      }

      return data;
    } catch (error) {
      console.error(`sellToken error for ${tokenAddress} on ${chain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        tokenAddress,
        percentToSell,
      };
    }
  }

  async getDemoBalance(chain: string): Promise<DemoBalance> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/demo/balance/${this.telegramId}/${chain}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`getDemoBalance error for ${chain}:`, error);
      throw error;
    }
  }

  async getDemoPositions(chain: string): Promise<any> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/demo/positions/${this.telegramId}/${chain}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`getDemoPositions error for ${chain}:`, error);
      throw error;
    }
  }

  async demoBuyToken(
    chain: string,
    tokenAddress: string,
    amountInNative: number
  ): Promise<any> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/demo/buy/${this.telegramId}/${chain}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            tokenAddress,
            amountInNative,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          tokenAddress,
          amountInNative,
        };
      }

      return data;
    } catch (error) {
      console.error(
        `demoBuyToken error for ${tokenAddress} on ${chain}:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        tokenAddress,
        amountInNative,
      };
    }
  }

  async demoSellToken(
    chain: string,
    tokenAddress: string,
    percentToSell: number
  ): Promise<any> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/demo/sell/${this.telegramId}/${chain}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            tokenAddress,
            percentToSell,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          tokenAddress,
          percentToSell,
        };
      }

      return data;
    } catch (error) {
      console.error(
        `demoSellToken error for ${tokenAddress} on ${chain}:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        tokenAddress,
        percentToSell,
      };
    }
  }

  async withdraw(
    chain: string,
    amount: number,
    destinationAddress: string
  ): Promise<any> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/withdraw/${this.telegramId}/${chain}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            amount,
            destinationAddress,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          amount,
          destinationAddress,
        };
      }

      return data;
    } catch (error) {
      console.error(`withdraw error for ${chain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        amount,
        destinationAddress,
      };
    }
  }

  formatBalance(balance: number, decimals = 2): string {
    return balance.toFixed(decimals);
  }

  calculatePositionPnL(
    position: Position,
    currentPrice: number
  ): {
    profitLoss: number;
    profitLossPercent: number;
  } {
    const avgBuyPrice = Number.parseFloat(position.avgBuyPrice);
    const amountHeld = Number.parseFloat(position.amountHeld);

    const profitLoss = (currentPrice - avgBuyPrice) * amountHeld;
    const profitLossPercent =
      ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;

    return { profitLoss, profitLossPercent };
  }

  // ============================================
  // PERPETUAL TRADING METHODS
  // ============================================

  async openPerpPosition(
    pair: string,
    isLong: boolean,
    collateral: number,
    leverage: number,
    entryPrice: number,
    chain = "base"
  ): Promise<OpenPerpPositionResponse> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/perp/open/${this.telegramId}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            pair,
            isLong,
            collateral,
            leverage,
            entryPrice,
            chain,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`openPerpPosition error for ${pair}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async closePerpPosition(
    positionId: string,
    exitPrice: number
  ): Promise<ClosePerpPositionResponse> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/perp/close/${positionId}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            exitPrice,
            telegramId: this.telegramId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`closePerpPosition error for ${positionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getPerpPositions(
    status?: "OPEN" | "CLOSED",
    chain?: string
  ): Promise<{ success: boolean; positions?: PerpPosition[]; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (chain) params.append("chain", chain);

      const queryString = params.toString();
      const url = `${this.backendUrl}/api/perp/positions/${this.telegramId}${
        queryString ? `?${queryString}` : ""
      }`;

      const res = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("getPerpPositions error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updatePerpPositionPnL(
    positionId: string,
    currentPrice: number
  ): Promise<{ success: boolean; position?: any; error?: string }> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/perp/update-pnl/${positionId}`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            currentPrice,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`updatePerpPositionPnL error for ${positionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getPerpTradingStats(chain?: string): Promise<PerpTradingStats> {
    try {
      const params = new URLSearchParams();
      if (chain) params.append("chain", chain);

      const queryString = params.toString();
      const url = `${this.backendUrl}/api/perp/stats/${this.telegramId}${
        queryString ? `?${queryString}` : ""
      }`;

      const res = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return await res.json();
    } catch (error) {
      console.error("getPerpTradingStats error:", error);
      throw error;
    }
  }
}