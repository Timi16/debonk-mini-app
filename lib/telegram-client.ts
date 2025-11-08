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
} from "./types";

export class MiniAppClient {
  private telegramId: string;
  private backendUrl: string;
  private initData: string;

  constructor(
    telegramId: string,
    initData: string,
    backendUrl = "https://delcie-unvariant-unlimitedly.ngrok-free.dev"
  ) {
    this.telegramId = telegramId;
    this.initData = initData;
    this.backendUrl = backendUrl;
  }

  private getHeaders(): Record<string, string> {
    return {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json",
      "x-telegram-init-data": this.initData,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

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

  // 🔥 UPDATED: Match actual API response structure
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
}
