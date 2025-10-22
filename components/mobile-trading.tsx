"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"


// Dynamically import WebApp only on client side
let WebApp: any = null
if (typeof window !== "undefined") {
  WebApp = require("@twa-dev/sdk").default
}

// MiniAppClient class
interface Chain {
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

interface Balance {
  success: boolean;
  telegramId: string;
  chain: string;
  balance: number;
  decimals: number;
  raw: string;
  type: "native" | "token";
  error?: string;
}

interface Position {
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

interface PositionWithPrice extends Position {
  currentPrice?: number;
  marketCap?: string;
  priceChange24h?: number;
}

interface UserProfile {
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

interface WalletAddress {
  success: boolean;
  telegramId: string;
  chain: string;
  address: string;
  error?: string;
}

interface TokenDetails {
  success: boolean;
  chain: string;
  contractAddress: string;
  token: {
    name: string;
    symbol: string;
    address: string;
    priceUsd: number;
    priceNative: number;
    marketCap: number;
    liquidityInUsd: number;
    twitterUrl?: string;
    websiteUrl?: string;
    telegramUrl?: string;
    volume?: {
      m5: number;
      h1: number;
      h24: number;
      d7?: number;
    };
    change?: {
      m5?: number;
      h1: number;
      h24: number;
      d7?: number;
    };
    source?: string;
  };
}

interface BuyResponse {
  success: boolean;
  telegramId: string;
  chain: string;
  tokenAddress: string;
  amountInNative: number;
  transactionHash?: string;
  message?: string;
  error?: string;
}

interface SellResponse {
  success: boolean;
  telegramId: string;
  chain: string;
  tokenAddress: string;
  percentToSell: number;
  transactionHash?: string;
  amountSold?: number;
  message?: string;
  error?: string;
}

class MiniAppClient {
  private telegramId: string;
  private backendUrl: string;

  constructor(telegramId: string, backendUrl: string = "https://exanthematic-anneliese-friskingly.ngrok-free.dev") {
    this.telegramId = telegramId;
    this.backendUrl = backendUrl;
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const res = await fetch(`${this.backendUrl}/api/user/${this.telegramId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        }
      });
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
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        }
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
      const res = await fetch(`${this.backendUrl}/api/balance/${this.telegramId}/${chain}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        }
      });
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
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          }
        }
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
      const res = await fetch(`${this.backendUrl}/api/wallet/${this.telegramId}/${chain}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`getWalletAddress error for ${chain}:`, error);
      throw error;
    }
  }

  async getAllPositions(): Promise<Position[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/positions/${this.telegramId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        }
      });
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
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          }
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
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          }
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

  async getTokenDetails(chain: string, contractAddress: string): Promise<TokenDetails> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/token/${chain}/${contractAddress}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          }
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`getTokenDetails error for ${contractAddress} on ${chain}:`, error);
      throw error;
    }
  }

  async buyToken(chain: string, tokenAddress: string, amountInNative: number, slippage: number = 0.5): Promise<BuyResponse> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/trade/buy/${this.telegramId}/${chain}`,
        {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenAddress,
            amountInNative,
            slippage
          })
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
          amountInNative
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
        amountInNative
      };
    }
  }

  async sellToken(chain: string, tokenAddress: string, percentToSell: number, slippage: number = 0.5): Promise<SellResponse> {
    try {
      const res = await fetch(
        `${this.backendUrl}/api/trade/sell/${this.telegramId}/${chain}`,
        {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenAddress,
            percentToSell,
            slippage
          })
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
          percentToSell
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
        percentToSell
      };
    }
  }

  formatBalance(balance: number, decimals: number = 2): string {
    return balance.toFixed(decimals);
  }

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

interface SelectedToken {
  name: string;
  symbol: string;
  address: string;
  pnlData: {
    fiveMin: string;
    oneHour: string;
    twentyFourHours: string;
  };
  marketData: {
    marketCap: string;
    liquidity: string;
    price: string;
    volume24h: string;
  };
  buyAmounts: string[];
  sellAmounts: string[];
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function MobileTrading() {
  const [activeTab, setActiveTab] = useState("home")
  const [mode, setMode] = useState<"demo" | "live">("demo")
  const [tokenInput, setTokenInput] = useState("")
  const [client, setClient] = useState<MiniAppClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [chains, setChains] = useState<Chain[]>([])
  const [selectedChain, setSelectedChain] = useState("solana")
  const [balance, setBalance] = useState(0)
  const [walletAddress, setWalletAddress] = useState("")
  const [positions, setPositions] = useState<PositionWithPrice[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState("")
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [showTokenDetail, setShowTokenDetail] = useState(false)
  const [selectedToken, setSelectedToken] = useState<SelectedToken | null>(null)
  const [pasteError, setPasteError] = useState("")
  const [hasValidToken, setHasValidToken] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isTrading, setIsTrading] = useState(false)
  const [isTradingId, setIsTradingId] = useState<string>()
  const [showCustomBuyInput, setShowCustomBuyInput] = useState(false)
  const [customBuyAmount, setCustomBuyAmount] = useState("")
  const [showCustomSellInput, setShowCustomSellInput] = useState(false)
  const [customSellAmount, setCustomSellAmount] = useState("")

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  // Refresh data after trade and enrich with prices
  const refreshData = async () => {
    if (!client) return

    try {
      const balanceData = await client.getBalance(selectedChain)
      if (balanceData.success) {
        setBalance(balanceData.balance)
      }

      const positionsData = await client.getPositionsByChain(selectedChain)

      // Enrich positions with current prices and market data
      const enrichedPositions = await Promise.all(
        positionsData.map(async (position) => {
          try {
            const details = await client.getTokenDetails(position.chain, position.tokenAddress)
            if (details.success) {
              const formatMarketCap = (mc: number): string => {
                if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`
                if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`
                if (mc >= 1e3) return `$${(mc / 1e3).toFixed(1)}K`
                return `$${mc.toFixed(0)}`
              }

              return {
                ...position,
                currentPrice: details.token.priceUsd,
                marketCap: formatMarketCap(details.token.marketCap),
                priceChange24h: details.token.change?.h24
              }
            }
            return position
          } catch (err) {
            console.error(`Failed to fetch price for ${position.tokenAddress}:`, err)
            return position
          }
        })
      )

      setPositions(enrichedPositions)
    } catch (err) {
      console.error("Error refreshing data:", err)
    }
  }

  // Handle buy with preset amount
  const handleBuyWithAmount = async (amountStr: string) => {
    if (!client || !selectedToken || isTrading) return

    // Parse amount (remove currency symbol)
    const amount = parseFloat(amountStr.split(' ')[0])

    if (isNaN(amount) || amount <= 0) {
      showNotification("Invalid amount", "error")
      return
    }

    setIsTrading(true)
    showNotification("Processing buy transaction...", "info")

    try {
      const result = await client.buyToken(
        selectedChain,
        selectedToken.address,
        amount,
        0.5 // 0.5% slippage
      )

      if (result.success) {
        showNotification("✅ Buy transaction successful!", "success")
        setShowTokenDetail(false)
        setTokenInput("")
        setSelectedToken(null)
        setHasValidToken(false)
        setShowCustomBuyInput(false)
        setCustomBuyAmount("")
        await refreshData()
      } else {
        showNotification(`❌ Buy failed: ${result.error}`, "error")
      }
    } catch (err) {
      showNotification(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`, "error")
    } finally {
      setIsTrading(false)
    }
  }

  // Handle custom buy amount
  const handleCustomBuy = async () => {
    const amount = parseFloat(customBuyAmount)

    if (isNaN(amount) || amount <= 0) {
      showNotification("Please enter a valid amount", "error")
      return
    }

    await handleBuyWithAmount(customBuyAmount)
  }

  // Handle sell with preset amount (percentage based)
  const handleSellWithAmount = async (amountStr: string) => {
    if (!client || !selectedToken || isTrading) return

    const position = positions.find(p => p.tokenAddress.toLowerCase() === selectedToken.address.toLowerCase())
    if (!position) {
      showNotification("Position not found", "error")
      return
    }

    // Parse amount (remove % symbol)
    let percent: number
    if (amountStr.includes('%')) {
      percent = parseFloat(amountStr.replace('%', ''))
    } else {
      percent = parseFloat(amountStr)
    }

    if (isNaN(percent) || percent <= 0 || percent > 100) {
      showNotification("Invalid sell amount (must be between 0-100%)", "error")
      return
    }

    setIsTrading(true)
    setIsTradingId(position.id)
    showNotification(`Processing sell ${percent}% transaction...`, "info")

    try {
      const result = await client.sellToken(
        position.chain,
        position.tokenAddress,
        percent,
        0.5 // 0.5% slippage
      )

      if (result.success) {
        showNotification(`✅ Sell transaction successful!`, "success")
        setShowTokenDetail(false)
        setShowCustomSellInput(false)
        setCustomSellAmount("")
        await refreshData()
      } else {
        showNotification(`❌ Sell failed: ${result.error}`, "error")
      }
    } catch (err) {
      showNotification(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`, "error")
    } finally {
      setIsTrading(false)
      setIsTradingId("")
    }
  }

  // Handle custom sell amount
  const handleCustomSell = async () => {
    const amount = parseFloat(customSellAmount)

    if (isNaN(amount) || amount <= 0 || amount > 100) {
      showNotification("Please enter a valid percentage (0-100)", "error")
      return
    }

    await handleSellWithAmount(customSellAmount)
  }

  // Handle position card click
  const handlePositionClick = async (position: PositionWithPrice) => {
    if (!client || isTrading) return

    showNotification("Loading token details...", "info")

    try {
      const details = await client.getTokenDetails(position.chain, position.tokenAddress)

      if (details.success) {
        const token = details.token

        const formatChange = (val: number | undefined): string => {
          if (val === undefined) return "0.00%"
          return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`
        }

        const formatMarketCap = (mc: number): string => {
          if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`
          if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`
          return `$${mc.toLocaleString()}`
        }

        const m5Change = token.change?.m5 ?? 0
        const h1Change = token.change?.h1 ?? 0
        const h24Change = token.change?.h24 ?? 0
        const h24Volume = token.volume?.h24 ?? 0

        const currentChain = chains.find(c => c.key === position.chain)
        const nativeSymbol = currentChain?.nativeToken.symbol || "SOL"

        const buyAmounts = [`0.1 ${nativeSymbol}`, `0.5 ${nativeSymbol}`, `1 ${nativeSymbol}`, `X ${nativeSymbol}`]
        const sellAmounts = [`10%`, `50%`, `75%`, `100%`]

        setSelectedToken({
          name: token.name,
          symbol: token.symbol,
          address: token.address,
          pnlData: {
            fiveMin: formatChange(m5Change),
            oneHour: formatChange(h1Change),
            twentyFourHours: formatChange(h24Change),
          },
          marketData: {
            marketCap: formatMarketCap(token.marketCap),
            liquidity: `$${token.liquidityInUsd.toLocaleString()}`,
            price: `$${token.priceUsd.toFixed(4)}`,
            volume24h: `$${h24Volume.toLocaleString()}`,
          },
          buyAmounts,
          sellAmounts,
        })

        setShowTokenDetail(true)
      } else {
        showNotification("Failed to fetch token details", "error")
      }
    } catch (err) {
      console.error("Failed to fetch token:", err)
      showNotification("Failed to load token details", "error")
    }
  }

  // Initialize client and load data
  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        console.log("=== TELEGRAM MINI APP INIT WITH SDK ===")

        // Initialize the WebApp SDK
        WebApp.ready()
        console.log("✓ WebApp SDK ready")

        const telegramId = WebApp.initDataUnsafe?.user?.id

        if (!telegramId) {
          console.error("❌ Could not extract Telegram ID")
          setError("Could not get Telegram ID from SDK")
          setLoading(false)
          return
        }

        console.log("✓ Got Telegram ID:", telegramId)
        const newClient = new MiniAppClient(telegramId.toString())
        setClient(newClient)

        // Load chains
        const chainsData = await newClient.getAvailableChains()
        setChains(chainsData)

        // Load user profile
        const profile = await newClient.getUserProfile()
        setUserProfile(profile)

        // Load initial balance and positions
        const balanceData = await newClient.getBalance("solana")
        if (balanceData.success) {
          setBalance(balanceData.balance)
        }

        const positionsData = await newClient.getPositionsByChain("solana")

        // Enrich positions with current prices
        const enrichedPositions = await Promise.all(
          positionsData.map(async (position) => {
            try {
              const details = await newClient.getTokenDetails(position.chain, position.tokenAddress)
              if (details.success) {
                const formatMarketCap = (mc: number): string => {
                  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`
                  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`
                  if (mc >= 1e3) return `$${(mc / 1e3).toFixed(1)}K`
                  return `$${mc.toFixed(0)}`
                }

                return {
                  ...position,
                  currentPrice: details.token.priceUsd,
                  marketCap: formatMarketCap(details.token.marketCap),
                  priceChange24h: details.token.change?.h24
                }
              }
              return position
            } catch (err) {
              console.error(`Failed to fetch price for ${position.tokenAddress}:`, err)
              return position
            }
          })
        )

        setPositions(enrichedPositions)

        const addressData = await newClient.getWalletAddress("solana")
        if (addressData.success) {
          setWalletAddress(addressData.address)
        }

        console.log("=== INIT COMPLETE ===")
      } catch (err) {
        console.error("❌ Initialization error:", err)
        setError(`Failed to initialize: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    initializeMiniApp()
  }, [])

  // Update data when chain changes
  useEffect(() => {
    if (!client) return

    const updateChainData = async () => {
      setLoadingPositions(true)
      try {
        const balanceData = await client.getBalance(selectedChain)
        if (balanceData.success) {
          setBalance(balanceData.balance)
        }

        const positionsData = await client.getPositionsByChain(selectedChain)

        // Enrich positions with current prices and market data
        const enrichedPositions = await Promise.all(
          positionsData.map(async (position) => {
            try {
              const details = await client.getTokenDetails(position.chain, position.tokenAddress)
              if (details.success) {
                const formatMarketCap = (mc: number): string => {
                  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`
                  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`
                  if (mc >= 1e3) return `$${(mc / 1e3).toFixed(1)}K`
                  return `$${mc.toFixed(0)}`
                }

                return {
                  ...position,
                  currentPrice: details.token.priceUsd,
                  marketCap: formatMarketCap(details.token.marketCap),
                  priceChange24h: details.token.change?.h24
                }
              }
              return position
            } catch (err) {
              console.error(`Failed to fetch price for ${position.tokenAddress}:`, err)
              return position
            }
          })
        )

        setPositions(enrichedPositions)

        const addressData = await client.getWalletAddress(selectedChain)
        if (addressData.success) {
          setWalletAddress(addressData.address)
        }
      } catch (err) {
        console.error("Error updating chain data:", err)
      } finally {
        setLoadingPositions(false)
      }
    }

    updateChainData()
  }, [selectedChain, client])

  const handleCopyAddress = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      showNotification("Address copied!", "success")
    }
  }

  const handlePasteClick = () => {
    setPasteError("Please long-press the input field and select 'Paste' to enter the contract address.")
  }

  const handleBuyClick = () => {
    if (selectedToken) {
      setShowTokenDetail(true)
    }
  }

  const handleInputChange = async (value: string) => {
    const ca = value.trim()
    setTokenInput(ca)
    setPasteError("")

    if (!ca) {
      setHasValidToken(false)
      setSelectedToken(null)
      setShowTokenDetail(false)
      return
    }

    const currentChain = chains.find(c => c.key === selectedChain)
    const nativeSymbol = currentChain?.nativeToken.symbol || "SOL"

    if (client) {
      try {
        console.log(`Fetching token details for CA: ${ca} on chain: ${selectedChain}`)
        const details = await client.getTokenDetails(selectedChain, ca)

        if (details.success) {
          const token = details.token

          const formatChange = (val: number | undefined): string => {
            if (val === undefined) return "0.00%"
            return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`
          }

          const formatMarketCap = (mc: number): string => {
            if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`
            if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`
            return `$${mc.toLocaleString()}`
          }

          const m5Change = token.change?.m5 ?? 0
          const h1Change = token.change?.h1 ?? 0
          const h24Change = token.change?.h24 ?? 0
          const h24Volume = token.volume?.h24 ?? 0

          const buyAmounts = [`0.1 ${nativeSymbol}`, `0.5 ${nativeSymbol}`, `1 ${nativeSymbol}`, `X ${nativeSymbol}`]
          const sellAmounts = [`10%`, `50%`, `75%`, `100%`]

          setSelectedToken({
            name: token.name,
            symbol: token.symbol,
            address: token.address,
            pnlData: {
              fiveMin: formatChange(m5Change),
              oneHour: formatChange(h1Change),
              twentyFourHours: formatChange(h24Change),
            },
            marketData: {
              marketCap: formatMarketCap(token.marketCap),
              liquidity: `${token.liquidityInUsd.toLocaleString()}`,
              price: `${token.priceUsd.toFixed(4)}`,
              volume24h: `${h24Volume.toLocaleString()}`,
            },
            buyAmounts,
            sellAmounts,
          })

          setHasValidToken(true)
        } else {
          setHasValidToken(false)
          setError("Failed to fetch token details")
        }
      } catch (err) {
        setHasValidToken(false)
        console.error("Failed to fetch token:", err)
        setError("Failed to process contract address")
      }
    }
  }

  const currentChain = chains.find(c => c.key === selectedChain)
  const nativeSymbol = currentChain?.nativeToken.symbol || "SOL"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Notifications */}
      <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${notification.type === 'success'
                ? 'bg-green-500/90 text-white'
                : notification.type === 'error'
                  ? 'bg-red-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 max-w-2xl mx-auto w-full pb-40 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ukVZDkLcTHvqwsfUVjBuRXDRQpqQGp.png"
              alt="Debonk Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-white">Debonk</h1>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Help" className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/material-symbols-light_help-wzZ3QyqUPIVgaNK2vj5Hj5spBBxnwv.png"
                alt="Help"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </button>
            <button aria-label="Notifications" className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fluent_alert-16-filled%20%281%29-7YZCWgx5VvVWw3txTFGlwTEnmh6kOr.png"
                alt="Notifications"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center w-full mb-6">
          <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#1F1F1F] rounded-full px-2 py-1.5">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${mode === "demo" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A]"} cursor-pointer`} onClick={() => setMode("demo")}>
              • Demo
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${mode === "live" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A]"} cursor-pointer`} onClick={() => setMode("live")}>
              • Live
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-6 mb-6 overflow-hidden border border-[#252525]">
          <div className="pointer-events-none select-none absolute right-4 top-1/2 -translate-y-1/2 opacity-15">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ukVZDkLcTHvqwsfUVjBuRXDRQpqQGp.png"
              alt="Debonk Watermark"
              width={160}
              height={160}
              className="w-40 h-40"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Main Wallet</span>
                <button onClick={handleCopyAddress} className="cursor-pointer">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ion_copy-tN5Kmg8bxbyMQVDSbLbfeMkejTdvGp.png"
                    alt="Copy"
                    width={14}
                    height={14}
                    className="w-3.5 h-3.5 opacity-50 hover:opacity-100"
                  />
                </button>
              </div>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="bg-[#1A1A1A] text-white text-xs border border-[#2A2A2A] rounded px-2 py-1"
              >
                {chains.map(chain => (
                  <option key={chain.key} value={chain.key}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 mb-4">Balance ~ ${(balance * 50).toFixed(2)}</p>
            <div className="flex items-baseline gap-2 mb-6">
              <h2 className="text-4xl font-bold text-white">{client?.formatBalance(balance) || "0.000"}</h2>
              <span className="text-xl text-gray-400">{nativeSymbol}</span>
              <button className="cursor-pointer" onClick={refreshData}>
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector%20%281%29-gWZ2CwEa51DiP49O5aKvC3WvEZ6Wpf.png"
                  alt="Refresh"
                  width={16}
                  height={16}
                  className="w-4 h-4 ml-1 opacity-50 hover:opacity-100"
                />
              </button>
            </div>
            <p className="text-sm text-red-400/90 mb-6">▼ 32.95%</p>

            <div className="flex gap-3">
              <Button className="flex-1 bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-xl h-11">
                Withdraw
              </Button>
              <Button className="flex-1 bg-[#1A1A1A] hover:bg-[#252525] text-white font-semibold rounded-xl h-11 border border-[#2A2A2A]">
                Deposit
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">Position Overview</h3>
        </div>

        <div className="space-y-3 mb-6">
          {loadingPositions ? (
            <div className="text-center text-gray-400 py-8">Loading positions...</div>
          ) : positions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No positions yet</div>
          ) : (
            positions.map((position) => {
              const priceChange24h = position.priceChange24h ?? 0
              const positionValue = position.currentPrice
                ? parseFloat(position.amountHeld) * position.currentPrice
                : 0

              return (
                <div
                  key={position.id}
                  className="bg-[#111111] border border-[#252525] rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                      onClick={() => handlePositionClick(position)}
                    >
                      <div className="text-base font-semibold text-white">${position.tokenTicker}</div>
                      {position.priceChange24h !== undefined && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${priceChange24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!client || isTrading) return

                        // Open modal first
                        // await handlePositionClick(position)

                        // Then trigger 100% sell after modal loads
                        setTimeout(() => {
                          handleSellWithAmount("100%")
                        }, 100)
                      }}
                      disabled={isTrading || isTradingId === position.id}
                      className="bg-[#3A3A3A] hover:bg-[#444444] text-white font-medium rounded-full px-4 h-9 text-xs disabled:opacity-50"
                    >
                      {isTrading && isTradingId === position.id ? "..." : "Sell 100%"}
                    </Button>
                  </div>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => handlePositionClick(position)}
                  >
                    {position.marketCap && (
                      <span className="text-xs text-gray-400">MC {position.marketCap}</span>
                    )}
                    {/* {position.currentPrice && (
                      <span className="text-xs text-gray-300">
                        ${position.currentPrice.toFixed(4)}
                      </span>
                    )} */}
                    {positionValue > 0 && (
                      <span className="text-xs font-semibold text-white">
                        ${positionValue.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="fixed bottom-3 left-0 right-0 bg-black border-t border-[#1A1A1A] shadow-[0_-8px_16px_rgba(0,0,0,0.35)] z-20 pb-5">
        <div className="px-6 pt-4 max-w-2xl mx-auto">
          <div className="relative">
            <Input
              value={tokenInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Contract Address or Token"
              disabled={isTrading}
              className="bg-[#1A1A1A] text-white placeholder:text-gray-500 rounded-full h-12 pr-24 pl-4 border border-[color:rgba(212,175,55,0.2)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] disabled:opacity-50"
            />
            <Button
              onClick={hasValidToken ? handleBuyClick : handlePasteClick}
              disabled={isTrading}
              className={`absolute right-1 top-1 h-10 px-4 rounded-full border ${hasValidToken ? 'bg-[#D4AF37] hover:opacity-90 text-black font-semibold border-transparent' : 'bg-[#3A3A3A] hover:bg-[#444444] text-white border border-[#4A4A4A]'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isTrading ? "..." : hasValidToken ? "Buy" : "Paste"}
            </Button>
          </div>
          {pasteError && (
            <p className="text-xs text-yellow-400 mt-1 text-center">{pasteError}</p>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-3 pb-[calc(env(safe-area-inset-bottom))] gap-2 max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab("home")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/solar_home-angle-bold-gR7dSmS8rT7GwQLgLNyDy791PEvoKp.png"
              alt="Home"
              width={24}
              height={24}
              className="w-6 h-6 opacity-50"
            />
            {activeTab === "home" && (
              <div className="w-8 h-0.5 bg-[#D4AF37]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("chart")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tabler_chart-candle-filled%20%281%29-GPtKvusIcPlwkcQG7W0WfjGM8i9RdR.png"
              alt="Charts"
              width={24}
              height={24}
              className={`w-6 h-6 ${activeTab === "chart" ? "" : "opacity-50"}`}
            />
            {activeTab === "chart" && (
              <div className="w-8 h-0.5 bg-[#D4AF37]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mingcute_settings-3-fill-Yb8fxgG1M6J2IVENmtTeQxHJFaHX88.png"
              alt="Settings"
              width={24}
              height={24}
              className={`w-6 h-6 ${activeTab === "settings" ? "" : "opacity-50"}`}
            />
            {activeTab === "settings" && (
              <div className="w-8 h-0.5 bg-[#D4AF37]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fluent_people-32-filled%20%281%29-brNvHlXOEiC63RCEkMnGTIjSKrl8Tr.png"
              alt="Social"
              width={24}
              height={24}
              className={`w-6 h-6 ${activeTab === "social" ? "" : "opacity-50"}`}
            />
            {activeTab === "social" && (
              <div className="w-8 h-0.5 bg-[#D4AF37]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("help")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/material-symbols-light_help-wzZ3QyqUPIVgaNK2vj5Hj5spBBxnwv.png"
              alt="Help"
              width={24}
              height={24}
              className={`w-6 h-6 ${activeTab === "help" ? "" : "opacity-50"}`}
            />
            {activeTab === "help" && (
              <div className="w-8 h-0.5 bg-[#D4AF37]"></div>
            )}
          </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-3 bg-black pointer-events-none z-10" />

      {/* Token Detail Modal */}
      {showTokenDetail && selectedToken && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowTokenDetail(false)}>
          <div className="bg-[#0F0F0F] w-full max-w-2xl rounded-t-3xl p-6 border-t border-[#252525] animate-slide-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{selectedToken.name}</h2>
              <button onClick={() => setShowTokenDetail(false)} className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">{selectedToken.symbol}</span>
                <span className="text-xs px-2 py-1 rounded bg-[#1A1A1A] text-gray-300">{selectedToken.marketData.price}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-[#1A1A1A] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">5m</div>
                  <div className={`text-sm font-semibold ${selectedToken.pnlData.fiveMin.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedToken.pnlData.fiveMin}
                  </div>
                </div>
                <div className="bg-[#1A1A1A] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">1h</div>
                  <div className={`text-sm font-semibold ${selectedToken.pnlData.oneHour.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedToken.pnlData.oneHour}
                  </div>
                </div>
                <div className="bg-[#1A1A1A] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">24h</div>
                  <div className={`text-sm font-semibold ${selectedToken.pnlData.twentyFourHours.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedToken.pnlData.twentyFourHours}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#1A1A1A] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Market Cap</div>
                  <div className="text-sm font-semibold text-white">{selectedToken.marketData.marketCap}</div>
                </div>
                <div className="bg-[#1A1A1A] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Liquidity</div>
                  <div className="text-sm font-semibold text-white">{selectedToken.marketData.liquidity}</div>
                </div>
                <div className="bg-[#1A1A1A] rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">24h Volume</div>
                  <div className="text-sm font-semibold text-white">{selectedToken.marketData.volume24h}</div>
                </div>
              </div>

              {/* Check if user has a position */}
              {positions.find(p => p.tokenAddress.toLowerCase() === selectedToken.address.toLowerCase()) ? (
                <>
                  {/* Show both Buy and Sell options */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3">Buy More</h3>
                      {showCustomBuyInput ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={customBuyAmount}
                            onChange={(e) => setCustomBuyAmount(e.target.value)}
                            placeholder={`Amount in ${nativeSymbol}`}
                            className="flex-1 bg-[#1A1A1A] text-white border border-[#2A2A2A] rounded-lg h-12"
                            disabled={isTrading}
                          />
                          <Button
                            onClick={handleCustomBuy}
                            disabled={isTrading || !customBuyAmount}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg h-12 px-6 disabled:opacity-50"
                          >
                            {isTrading ? "..." : "Buy"}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowCustomBuyInput(false)
                              setCustomBuyAmount("")
                            }}
                            className="bg-[#3A3A3A] hover:bg-[#444444] text-white rounded-lg h-12 px-4"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedToken.buyAmounts.map((amount, index) => (
                            <Button
                              key={index}
                              onClick={() => {
                                if (amount.startsWith('X')) {
                                  setShowCustomBuyInput(true)
                                } else {
                                  handleBuyWithAmount(amount)
                                }
                              }}
                              disabled={isTrading}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg h-12 disabled:opacity-50"
                            >
                              {isTrading ? "..." : amount.startsWith('X') ? `Custom` : amount}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3">Sell Position</h3>
                      {showCustomSellInput ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={customSellAmount}
                            onChange={(e) => setCustomSellAmount(e.target.value)}
                            placeholder="Percentage (0-100)"
                            className="flex-1 bg-[#1A1A1A] text-white border border-[#2A2A2A] rounded-lg h-12"
                            disabled={isTrading}
                          />
                          <Button
                            onClick={handleCustomSell}
                            disabled={isTrading || !customSellAmount}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg h-12 px-6 disabled:opacity-50"
                          >
                            {isTrading ? "..." : "Sell"}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowCustomSellInput(false)
                              setCustomSellAmount("")
                            }}
                            className="bg-[#3A3A3A] hover:bg-[#444444] text-white rounded-lg h-12 px-4"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedToken.sellAmounts.map((amount, index) => (
                            <Button
                              key={index}
                              onClick={() => {
                                if (amount === 'X') {
                                  setShowCustomSellInput(true)
                                } else {
                                  handleSellWithAmount(amount)
                                }
                              }}
                              disabled={isTrading}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg h-12 disabled:opacity-50"
                            >
                              {isTrading ? "..." : amount === 'X' ? 'Custom' : amount}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Show only Buy options for new tokens */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white mb-3">Quick Buy</h3>
                    {showCustomBuyInput ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={customBuyAmount}
                          onChange={(e) => setCustomBuyAmount(e.target.value)}
                          placeholder={`Amount in ${nativeSymbol}`}
                          className="flex-1 bg-[#1A1A1A] text-white border border-[#2A2A2A] rounded-lg h-12"
                          disabled={isTrading}
                        />
                        <Button
                          onClick={handleCustomBuy}
                          disabled={isTrading || !customBuyAmount}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg h-12 px-6 disabled:opacity-50"
                        >
                          {isTrading ? "..." : "Buy"}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCustomBuyInput(false)
                            setCustomBuyAmount("")
                          }}
                          className="bg-[#3A3A3A] hover:bg-[#444444] text-white rounded-lg h-12 px-4"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedToken.buyAmounts.map((amount, index) => (
                          <Button
                            key={index}
                            onClick={() => {
                              if (amount.startsWith('X')) {
                                setShowCustomBuyInput(true)
                              } else {
                                handleBuyWithAmount(amount)
                              }
                            }}
                            disabled={isTrading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg h-12 disabled:opacity-50"
                          >
                            {isTrading ? "..." : amount.startsWith('X') ? `Custom` : amount}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}