import type {
  Chain,
  Balance,
  Position,
  UserProfile,
  WalletAddress,
  TokenDetails,
  BuyResponse,
  SellResponse,
  BalanceHistory,
} from "./types"

export class MiniAppClient {
  private telegramId: string
  private backendUrl: string
  private initData: string
  private balanceHistory: Map<string, BalanceHistory[]> = new Map()

  constructor(
    telegramId: string,
    initData: string,
    backendUrl = "https://exanthematic-anneliese-friskingly.ngrok-free.dev",
  ) {
    this.telegramId = telegramId
    this.initData = initData
    this.backendUrl = backendUrl
    this.loadBalanceHistory()
  }

  private getHeaders(): Record<string, string> {
    return {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json",
      "x-telegram-init-data": this.initData,
    }
  }

  private loadBalanceHistory() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`balance_history_${this.telegramId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          this.balanceHistory = new Map(Object.entries(parsed))
        }
      } catch (error) {
        console.error("Failed to load balance history:", error)
      }
    }
  }

  private saveBalanceHistory() {
    if (typeof window !== "undefined") {
      try {
        const obj = Object.fromEntries(this.balanceHistory)
        localStorage.setItem(`balance_history_${this.telegramId}`, JSON.stringify(obj))
      } catch (error) {
        console.error("Failed to save balance history:", error)
      }
    }
  }

  recordBalanceSnapshot(chain: string, balance: number, usdValue: number) {
    const history = this.balanceHistory.get(chain) || []
    const now = Date.now()
    
    // Add new snapshot
    history.push({ timestamp: now, balance, usdValue })
    
    // Keep only last 100 snapshots and remove entries older than 30 days
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const filtered = history
      .filter(h => h.timestamp > thirtyDaysAgo)
      .slice(-100)
    
    this.balanceHistory.set(chain, filtered)
    this.saveBalanceHistory()
  }

  getBalanceChange(chain: string, timeframeMs: number): {
    changeAmount: number
    changePercent: number
    hasData: boolean
  } {
    const history = this.balanceHistory.get(chain) || []
    if (history.length < 2) {
      return { changeAmount: 0, changePercent: 0, hasData: false }
    }

    const now = Date.now()
    const targetTime = now - timeframeMs
    
    // Get current balance (most recent)
    const current = history[history.length - 1]
    
    // Find closest balance to target time
    let closest = history[0]
    let minDiff = Math.abs(closest.timestamp - targetTime)
    
    for (const snapshot of history) {
      const diff = Math.abs(snapshot.timestamp - targetTime)
      if (diff < minDiff) {
        minDiff = diff
        closest = snapshot
      }
    }
    
    // Calculate change
    const changeAmount = current.usdValue - closest.usdValue
    const changePercent = closest.usdValue !== 0 
      ? (changeAmount / closest.usdValue) * 100 
      : 0
    
    return { changeAmount, changePercent, hasData: true }
  }

  get24HourBalanceChange(chain: string) {
    return this.getBalanceChange(chain, 24 * 60 * 60 * 1000)
  }

  getHourBalanceChange(chain: string) {
    return this.getBalanceChange(chain, 60 * 60 * 1000)
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const res = await fetch(`${this.backendUrl}/api/user/${this.telegramId}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error("getUserProfile error:", error)
      throw error
    }
  }

  async getAvailableChains(): Promise<Chain[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/chains`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.chains
    } catch (error) {
      console.error("getAvailableChains error:", error)
      throw error
    }
  }

  async getBalance(chain: string): Promise<Balance> {
    try {
      const res = await fetch(`${this.backendUrl}/api/balance/${this.telegramId}/${chain}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error(`getBalance error for ${chain}:`, error)
      throw error
    }
  }

  async getTokenBalance(chain: string, tokenAddress: string): Promise<Balance> {
    try {
      const res = await fetch(`${this.backendUrl}/api/balance/${this.telegramId}/${chain}/${tokenAddress}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error(`getTokenBalance error for ${tokenAddress} on ${chain}:`, error)
      throw error
    }
  }

  async getWalletAddress(chain: string): Promise<WalletAddress> {
    try {
      const res = await fetch(`${this.backendUrl}/api/wallet/${this.telegramId}/${chain}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error(`getWalletAddress error for ${chain}:`, error)
      throw error
    }
  }

  async getAllPositions(): Promise<Position[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/positions/${this.telegramId}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.positions
    } catch (error) {
      console.error("getAllPositions error:", error)
      throw error
    }
  }

  async getPositionsByChain(chain: string): Promise<Position[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/positions/${this.telegramId}/chain/${chain}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.positions
    } catch (error) {
      console.error(`getPositionsByChain error for ${chain}:`, error)
      throw error
    }
  }

  async getActiveCompetitionPositions(): Promise<Position[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/positions/${this.telegramId}/active-competition`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) {
        if (res.status === 404) return []
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      return data.positions
    } catch (error) {
      console.error("getActiveCompetitionPositions error:", error)
      throw error
    }
  }

  async getTokenDetails(chain: string, contractAddress: string): Promise<TokenDetails> {
    try {
      const res = await fetch(`${this.backendUrl}/api/token/${chain}/${contractAddress}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error(`getTokenDetails error for ${contractAddress} on ${chain}:`, error)
      throw error
    }
  }

  async buyToken(chain: string, tokenAddress: string, amountInNative: number, slippage = 1): Promise<BuyResponse> {
    try {
      const res = await fetch(`${this.backendUrl}/api/trade/buy/${this.telegramId}/${chain}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          tokenAddress,
          amountInNative,
          slippage,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          tokenAddress,
          amountInNative,
        }
      }

      return data
    } catch (error) {
      console.error(`buyToken error for ${tokenAddress} on ${chain}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        tokenAddress,
        amountInNative,
      }
    }
  }

  async sellToken(chain: string, tokenAddress: string, percentToSell: number, slippage = 0.5): Promise<SellResponse> {
    try {
      const res = await fetch(`${this.backendUrl}/api/trade/sell/${this.telegramId}/${chain}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          tokenAddress,
          percentToSell,
          slippage,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          tokenAddress,
          percentToSell,
        }
      }

      return data
    } catch (error) {
      console.error(`sellToken error for ${tokenAddress} on ${chain}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        tokenAddress,
        percentToSell,
      }
    }
  }

  async getDemoBalance(chain: string): Promise<{ success: boolean; demoBalance: string; nativeToken: string }> {
    try {
      const res = await fetch(`${this.backendUrl}/api/demo/balance/${this.telegramId}/${chain}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error(`getDemoBalance error for ${chain}:`, error)
      throw error
    }
  }

  async getDemoPositions(chain: string): Promise<any> {
    try {
      const res = await fetch(`${this.backendUrl}/api/demo/positions/${this.telegramId}/${chain}`, {
        headers: this.getHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error(`getDemoPositions error for ${chain}:`, error)
      throw error
    }
  }

  async demoBuyToken(chain: string, tokenAddress: string, amountInNative: number): Promise<any> {
    try {
      const res = await fetch(`${this.backendUrl}/api/demo/buy/${this.telegramId}/${chain}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          tokenAddress,
          amountInNative,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          tokenAddress,
          amountInNative,
        }
      }

      return data
    } catch (error) {
      console.error(`demoBuyToken error for ${tokenAddress} on ${chain}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        tokenAddress,
        amountInNative,
      }
    }
  }

  async demoSellToken(chain: string, tokenAddress: string, percentToSell: number): Promise<any> {
    try {
      const res = await fetch(`${this.backendUrl}/api/demo/sell/${this.telegramId}/${chain}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          tokenAddress,
          percentToSell,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          tokenAddress,
          percentToSell,
        }
      }

      return data
    } catch (error) {
      console.error(`demoSellToken error for ${tokenAddress} on ${chain}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        tokenAddress,
        percentToSell,
      }
    }
  }

  async withdraw(chain: string, amount: number, destinationAddress: string): Promise<any> {
    try {
      const res = await fetch(`${this.backendUrl}/api/withdraw/${this.telegramId}/${chain}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          amount,
          destinationAddress,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}`,
          telegramId: this.telegramId,
          chain,
          amount,
          destinationAddress,
        }
      }

      return data
    } catch (error) {
      console.error(`withdraw error for ${chain}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        telegramId: this.telegramId,
        chain,
        amount,
        destinationAddress,
      }
    }
  }

  formatBalance(balance: number, decimals = 2): string {
    return balance.toFixed(decimals)
  }

  calculatePositionPnL(
    position: Position,
    currentPrice: number,
  ): {
    profitLoss: number
    profitLossPercent: number
  } {
    const avgBuyPrice = Number.parseFloat(position.avgBuyPrice)
    const amountHeld = Number.parseFloat(position.amountHeld)

    const profitLoss = (currentPrice - avgBuyPrice) * amountHeld
    const profitLossPercent = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100

    return { profitLoss, profitLossPercent }
  }
}