// lib/miniapp-client.ts

export interface Chain {
  key: string;
  name: string;
  chainId: string | number;
  nativeToken: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl: string;
}

export interface Balance {
  success: boolean;
  telegramId: string;
  chain: string;
  balance: number;
  decimals: number;
  raw: string;
  type: "native" | "token";
  error?: string;
}

export interface Position {
  id: string;
  tokenAddress: string;
  tokenTicker: string;
  amountHeld: string;
  avgBuyPrice: string;
  chain: string;
  walletId: string;
  isSimulation: boolean;
  competitionId: string | null;
  teamId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  success: boolean;
  user: {
    id: number;
    telegramId: string;
    referralProfit: number;
    referralCountDirect: number;
    referralCountIndirect: number;
    simulationBalance: string;
    activeCompetitionId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    positionsCount: number;
    transactionsCount: number;
  };
}

export interface WalletAddress {
  success: boolean;
  telegramId: string;
  chain: string;
  address: string;
  error?: string;
}

export class MiniAppClient {
  private telegramId: string;
  private backendUrl: string;

  constructor(telegramId: string, backendUrl: string = "http://170.75.163.164:5119") {
    this.telegramId = telegramId;
    this.backendUrl = backendUrl;
  }

  // ==================== User & Profile ====================

  async getUserProfile(): Promise<UserProfile> {
    try {
      const res = await fetch(`${this.backendUrl}/api/user/${this.telegramId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("getUserProfile error:", error);
      throw error;
    }
  }

  // ==================== Chains ====================

  async getAvailableChains(): Promise<Chain[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/chains`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.chains;
    } catch (error) {
      console.error("getAvailableChains error:", error);
      throw error;
    }
  }

  // ==================== Balance & Wallet ====================

  async getBalance(chain: string): Promise<Balance> {
    try {
      const res = await fetch(`${this.backendUrl}/api/balance/${this.telegramId}/${chain}`);
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
        `${this.backendUrl}/api/balance/${this.telegramId}/${chain}/${tokenAddress}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`getTokenBalance error for ${tokenAddress} on ${chain}:`, error);
      throw error;
    }
  }

  async getWalletAddress(chain: string): Promise<WalletAddress> {
    try {
      const res = await fetch(`${this.backendUrl}/api/wallet/${this.telegramId}/${chain}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`getWalletAddress error for ${chain}:`, error);
      throw error;
    }
  }

  // ==================== Positions ====================

  async getAllPositions(): Promise<Position[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/positions/${this.telegramId}`);
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
        `${this.backendUrl}/api/positions/${this.telegramId}/chain/${chain}`
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
        `${this.backendUrl}/api/positions/${this.telegramId}/active-competition`
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

  // ==================== Helper Methods ====================

  /**
   * Format a balance for display
   */
  formatBalance(balance: number, decimals: number = 2): string {
    return balance.toFixed(decimals);
  }

  /**
   * Parse a position to calculate P&L
   */
  calculatePositionPnL(position: Position, currentPrice: number): {
    profitLoss: number;
    profitLossPercent: number;
  } {
    const avgBuyPrice = parseFloat(position.avgBuyPrice);
    const amountHeld = parseFloat(position.amountHeld);

    const profitLoss = (currentPrice - avgBuyPrice) * amountHeld;
    const profitLossPercent = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;

    return { profitLoss, profitLossPercent };
  }
}