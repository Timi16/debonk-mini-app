"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import dynamic from "next/dynamic"
import { TokenDetailModal } from "./token-detail-modal"

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
      console.log("getAvailableChains response status:", res.status);
      console.log("getAvailableChains response ok:", res.ok);
      if (!res.ok) {
        const text = await res.text();
        console.log("Error response:", text);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log("getAvailableChains data:", data);
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
}

export function MobileTrading() {
  const [activeTab, setActiveTab] = useState("home")
  const [mode, setMode] = useState<"demo" | "live">("demo")
  const [tokenInput, setTokenInput] = useState("")
  const [client, setClient] = useState<MiniAppClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [chains, setChains] = useState<Chain[]>([])
  const [selectedChain, setSelectedChain] = useState("solana")
  const [balance, setBalance] = useState(0)
  const [walletAddress, setWalletAddress] = useState("")
  const [positions, setPositions] = useState<Position[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState("")
  const [showTokenDetail, setShowTokenDetail] = useState(false)
  const [selectedToken, setSelectedToken] = useState<SelectedToken | null>(null)
  const [pasteError, setPasteError] = useState("")
  const [hasValidToken, setHasValidToken] = useState(false)

  // Initialize client and load data
  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        console.log("=== TELEGRAM MINI APP INIT WITH SDK ===")

        // Initialize the WebApp SDK
        WebApp.ready()
        console.log("✓ WebApp SDK ready")

        console.log("WebApp:", WebApp)
        console.log("initDataUnsafe:", WebApp.initDataUnsafe)

        const telegramId = WebApp.initDataUnsafe?.user?.id

        console.log("Extracted telegramId:", telegramId)
        console.log("Type:", typeof telegramId)

        if (!telegramId) {
          console.error("❌ Could not extract Telegram ID")
          console.log("Full initDataUnsafe:", JSON.stringify(WebApp.initDataUnsafe, null, 2))
          setError("Could not get Telegram ID from SDK")
          setLoading(false)
          return
        }

        console.log("✓ Got Telegram ID:", telegramId)
        const newClient = new MiniAppClient(telegramId.toString())
        setClient(newClient)

        // Load chains
        console.log("Loading chains...")
        const chainsData = await newClient.getAvailableChains()
        console.log("✓ Chains loaded:", chainsData.length)
        setChains(chainsData)

        // Load user profile
        console.log("Loading user profile...")
        const profile = await newClient.getUserProfile()
        console.log("✓ Profile loaded:", profile.user.telegramId)
        setUserProfile(profile)

        // Load initial balance and positions
        console.log("Loading balance for solana...")
        const balanceData = await newClient.getBalance("solana")
        console.log("✓ Balance loaded:", balanceData.balance)
        if (balanceData.success) {
          setBalance(balanceData.balance)
        }

        console.log("Loading positions for solana...")
        const positionsData = await newClient.getPositionsByChain("solana")
        console.log("✓ Positions loaded:", positionsData.length)
        setPositions(positionsData)

        console.log("Loading wallet address for solana...")
        const addressData = await newClient.getWalletAddress("solana")
        console.log("✓ Wallet address loaded:", addressData.address)
        if (addressData.success) {
          setWalletAddress(addressData.address)
        }

        console.log("=== INIT COMPLETE ===")
      } catch (err) {
        console.error("❌ Initialization error:", err)
        console.error("Error stack:", err instanceof Error ? err.stack : "No stack")
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
      try {
        const balanceData = await client.getBalance(selectedChain)
        if (balanceData.success) {
          setBalance(balanceData.balance)
        }

        const positionsData = await client.getPositionsByChain(selectedChain)
        setPositions(positionsData)

        const addressData = await client.getWalletAddress(selectedChain)
        if (addressData.success) {
          setWalletAddress(addressData.address)
        }
      } catch (err) {
        console.error("Error updating chain data:", err)
      }
    }

    updateChainData()
  }, [selectedChain, client])

  const handleCopyAddress = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && walletAddress) {
      navigator.clipboard.writeText(walletAddress)
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
        // Fetch token details using the input CA and selected chain
        console.log(`Fetching token details for CA: ${ca} on chain: ${selectedChain}`)
        const details = await client.getTokenDetails(selectedChain, ca)

        if (details.success) {
          const token = details.token

          // Format changes with sign
          const formatChange = (val: number | undefined): string => {
            if (val === undefined) return "0.00%"
            return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`
          }

          // Format market cap
          const formatMarketCap = (mc: number): string => {
            if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`
            if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`
            return `$${mc.toLocaleString()}`
          }

          const m5Change = token.change?.m5 ?? 0
          const h1Change = token.change?.h1 ?? 0
          const h24Change = token.change?.h24 ?? 0
          const h24Volume = token.volume?.h24 ?? 0

          const buyAmounts = [`0.1 ${nativeSymbol}`, `0.5 ${nativeSymbol}`, `10 ${nativeSymbol}`, `X ${nativeSymbol}`]

          setSelectedToken({
            name: token.name,
            symbol: token.symbol,
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
          })

          setHasValidToken(true)
        } else {
          setHasValidToken(false)
          setError("Failed to fetch token details")
          console.error("Token details fetch failed:", details)
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
              <button className="cursor-pointer">
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
              <Button className="flex-1 bg-[var(--brand-gold)] hover:opacity-90 text-black font-semibold rounded-xl h-11">
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
          {positions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No positions yet</div>
          ) : (
            positions.map((position) => (
              <div key={position.id} className="bg-[#111111] border border-[#252525] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-base font-semibold text-white">${position.tokenTicker}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-[10px] leading-none bg-[#1E1E1E] text-gray-300 border border-[#2A2A2A]">
                        {parseFloat(position.amountHeld).toFixed(2)}
                      </span>
                      <span className="px-2 py-1 rounded-full text-[10px] leading-none bg-[#1E1E1E] text-gray-300 border border-[#2A2A2A]">
                        ${parseFloat(position.avgBuyPrice).toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-300">
                      {parseFloat(position.amountHeld).toFixed(4)} {position.tokenTicker}
                    </span>
                    <Button className="bg-[#3A3A3A] hover:bg-[#444444] text-white text-sm h-9 px-5 rounded-full font-medium shadow-inner border border-[#444444]">
                      Sell 100%
                    </Button>
                  </div>
                </div>
              </div>
            ))
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
              className="bg-[#1A1A1A] text-white placeholder:text-gray-500 rounded-full h-12 pr-24 pl-4 border border-[color:rgba(212,175,55,0.2)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
            />
            <Button
              onClick={hasValidToken ? handleBuyClick : handlePasteClick}
              className={`absolute right-1 top-1 h-10 px-4 rounded-full border ${hasValidToken ? 'bg-[var(--brand-gold)] hover:opacity-90 text-black font-semibold border-transparent' : 'bg-[#3A3A3A] hover:bg-[#444444] text-white border border-[#4A4A4A]'}`}
            >
              {hasValidToken ? "Buy" : "Paste"}
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
      <TokenDetailModal
        isOpen={showTokenDetail}
        onClose={() => setShowTokenDetail(false)}
        tokenName={selectedToken?.name || ""}
        tokenSymbol={selectedToken?.symbol || ""}
        pnlData={selectedToken?.pnlData || { fiveMin: "0%", oneHour: "0%", twentyFourHours: "0%" }}
        marketData={selectedToken?.marketData || { marketCap: "$0", liquidity: "$0", price: "$0", volume24h: "$0" }}
        buyAmounts={selectedToken?.buyAmounts || []}
      />
    </div>
  )
}