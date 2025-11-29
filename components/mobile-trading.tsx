"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { MiniAppClient } from "@/lib/telegram-client"
import { DepositModal } from "./deposit-modal"
import { WithdrawModal } from "./withdraw-modal"
import type { Chain, PositionWithPrice, UserProfile, SelectedToken, Notification } from "@/lib/types"
import { getCachedPrice } from "@/lib/price-cache"
import { RefreshCcw, Copy } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { dummyChains, positionsWithPrice } from "@/lib/dummyData";
import logo from "@/assets/logo.webp";
import WalletSkeleton from "./loading-skeleton"
import FuturesTrading from "./futures-trading"

let WebApp: any = null

export default function MobileTrading() {
  const [activeTab, setActiveTab] = useState("home")
  const [mode, setMode] = useState<"demo" | "live">("demo")
  const [tokenInput, setTokenInput] = useState("")
  const [client, setClient] = useState<MiniAppClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [chains, setChains] = useState<Chain[]>([])
  const [selectedChain, setSelectedChain] = useState("solana")
  const [chainLoaded, setChainLoaded] = useState(false)
  const [balance, setBalance] = useState(0)
  const [nativePrice, setNativePrice] = useState(0)
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
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [balancePriceChange, setBalancePriceChange] = useState(0)
  const [demoBalance, setDemoBalance] = useState(0)
  const [demoPositions, setDemoPositions] = useState<PositionWithPrice[]>([])

  const initialBalancesRef = useRef<Record<string, Record<string, number>>>({
    demo: {},
    live: {},
  })
  const initializedRef = useRef<Set<string>>(new Set())

  // Show notification
  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }

  const calculateBalancePriceChange = (currentBalance: number, initialBal: number) => {
    if (initialBal === 0 || initialBal === undefined) return 0
    return ((currentBalance - initialBal) / initialBal) * 100
  }

  const fetchNativePrice = async (chainKey: string) => {
    try {
      const currentChain = chains.find((c) => c.key === chainKey)
      const symbol = currentChain?.nativeToken.symbol?.toUpperCase() || "SOL"

      const price = await getCachedPrice(symbol)

      if (typeof price !== "number") {
        console.error(`[v0] Invalid price for ${symbol}`)
        return
      }

      setNativePrice(price)
    } catch (err) {
      console.error("[v0] Error fetching native token price:", err)
    }
  }

  const fetchChainData = async (chainKey: string, modeType: "demo" | "live", isInitialLoad = false) => {
    if (!client) return

    try {
      const initKey = `${modeType}-${chainKey}`
      const isFirstTimeForThisChain = !initializedRef.current.has(initKey)

      if (modeType === "demo") {
        // Fetch demo balance
        const demoBalanceData = await client.getDemoBalance(chainKey)
        if (demoBalanceData.success) {
          const demoBalanceNum = Number.parseFloat(demoBalanceData.demoBalance)
          setDemoBalance(demoBalanceNum)

          if (isFirstTimeForThisChain) {
            initialBalancesRef.current.demo[chainKey] = demoBalanceNum
            initializedRef.current.add(initKey)
            setBalancePriceChange(0)
          } else {
            const priceChange = calculateBalancePriceChange(demoBalanceNum, initialBalancesRef.current.demo[chainKey])
            setBalancePriceChange(priceChange)
          }
        }

        // Fetch demo positions
        const demoPositionsData = await client.getDemoPositions(chainKey)
        if (demoPositionsData.success && demoPositionsData.positions) {
          const enrichedPositions = await Promise.all(
            demoPositionsData.positions.map(async (position: any) => {
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
                    priceChange24h: details.token.change?.h24,
                  }
                }
                return position
              } catch (err) {
                console.error(`[v0] Failed to fetch price for ${position.tokenAddress}:`, err)
                return position
              }
            }),
          )
          setDemoPositions(enrichedPositions)
        }
      } else {
        // Fetch live balance
        const balanceData = await client.getBalance(chainKey)
        if (balanceData.success) {
          setBalance(balanceData.balance)

          if (isFirstTimeForThisChain) {
            initialBalancesRef.current.live[chainKey] = balanceData.balance
            initializedRef.current.add(initKey)
            setBalancePriceChange(0)
          } else {
            const priceChange = calculateBalancePriceChange(
              balanceData.balance,
              initialBalancesRef.current.live[chainKey],
            )
            setBalancePriceChange(priceChange)
          }
        }

        // Fetch live positions
        const positionsData = await client.getPositionsByChain(chainKey)
        const livePositionsOnly = positionsData.filter((p) => !p.isSimulation)

        const enrichedPositions = await Promise.all(
          livePositionsOnly.map(async (position) => {
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
                  priceChange24h: details.token.change?.h24,
                }
              }
              return position
            } catch (err) {
              console.error(`[v0] Failed to fetch price for ${position.tokenAddress}:`, err)
              return position
            }
          }),
        )

        setPositions(enrichedPositions)
      }
    } catch (err) {
      console.error("[v0] Error fetching chain data:", err)
    }
  }

  // Refresh data after trade and enrich with prices
  const refreshData = async () => {
    if (!client) return

    try {
      await fetchChainData(selectedChain, mode, false)
      await fetchNativePrice(selectedChain)
    } catch (err) {
      console.error("[v0] Error refreshing data:", err)
    }
  }

  // Handle buy with preset amount
  const handleBuyWithAmount = async (amountStr: string) => {
    if (!client || !selectedToken || isTrading) return

    const amount = Number.parseFloat(amountStr.split(" ")[0])

    if (isNaN(amount) || amount <= 0) {
      showNotification("Invalid amount", "error")
      return
    }

    setIsTrading(true)
    showNotification("Processing buy transaction...", "info")

    try {
      const result =
        mode === "demo"
          ? await client.demoBuyToken(selectedChain, selectedToken.address, amount)
          : await client.buyToken(selectedChain, selectedToken.address, amount, 0.5)

      if (result.success) {
        showNotification("Buy transaction successful!", "success")
        setShowTokenDetail(false)
        setTokenInput("")
        setSelectedToken(null)
        setHasValidToken(false)
        setShowCustomBuyInput(false)
        setCustomBuyAmount("")
        await refreshData()
      } else {
        showNotification(`Buy failed: ${result.error}`, "error")
      }
    } catch (err) {
      showNotification(`Error: ${err instanceof Error ? err.message : "Unknown error"}`, "error")
    } finally {
      setIsTrading(false)
    }
  }

  // Handle custom buy amount
  const handleCustomBuy = async () => {
    const amount = Number.parseFloat(customBuyAmount)

    if (isNaN(amount) || amount <= 0) {
      showNotification("Please enter a valid amount", "error")
      return
    }

    await handleBuyWithAmount(customBuyAmount)
  }

  // Handle sell with preset amount (percentage based)
  const handleSellWithAmount = async (amountStr: string) => {
    if (!client || !selectedToken || isTrading) return

    const positionsList = mode === "demo" ? demoPositions : positions
    const position = positionsList.find((p) => p.tokenAddress.toLowerCase() === selectedToken.address.toLowerCase())
    if (!position) {
      showNotification("Position not found", "error")
      return
    }

    let percent: number
    if (amountStr.includes("%")) {
      percent = Number.parseFloat(amountStr.replace("%", ""))
    } else {
      percent = Number.parseFloat(amountStr)
    }

    if (isNaN(percent) || percent <= 0 || percent > 100) {
      showNotification("Invalid sell amount (must be between 0-100%)", "error")
      return
    }

    setIsTrading(true)
    setIsTradingId(position.id)
    showNotification(`Processing sell ${percent}% transaction...`, "info")

    try {
      const result =
        mode === "demo"
          ? await client.demoSellToken(position.chain, position.tokenAddress, percent)
          : await client.sellToken(position.chain, position.tokenAddress, percent, 0.5)

      if (result.success) {
        showNotification("Sell transaction successful!", "success")
        setShowTokenDetail(false)
        setShowCustomSellInput(false)
        setCustomSellAmount("")
        await refreshData()
      } else {
        showNotification(`Sell failed: ${result.error}`, "error")
      }
    } catch (err) {
      showNotification(`Error: ${err instanceof Error ? err.message : "Unknown error"}`, "error")
    } finally {
      setIsTrading(false)
      setIsTradingId("")
    }
  }

  // Handle custom sell amount
  const handleCustomSell = async () => {
    const amount = Number.parseFloat(customSellAmount)

    if (isNaN(amount) || amount <= 0) {
      showNotification("Please enter a valid amount", "error")
      return
    }

    if (amount > 100) {
      showNotification("Please enter a percentage between 0-100", "error")
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
          if (mc >= 1e3) return `$${(mc / 1e3).toFixed(1)}K`
          return `$${mc.toLocaleString()}`
        }

        const m5Change = token.change?.m5 ?? 0
        const h1Change = token.change?.h1 ?? 0
        const h24Change = token.change?.h24 ?? 0
        const h24Volume = token.volume?.h24 ?? 0

        const currentChain = chains.find((c) => c.key === position.chain)
        const nativeSymbol = currentChain?.nativeToken.symbol || "SOL"

        const buyAmounts = [`0.1 ${nativeSymbol}`, `0.5 ${nativeSymbol}`, `X ${nativeSymbol}`]
        const sellAmounts = [`50%`, `100%`, `X`]

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
            liquidity: formatMarketCap(token.liquidityInUsd),
            price: `$${token.priceUsd.toFixed(4)}`,
            volume24h: formatMarketCap(h24Volume),
          },
          buyAmounts,
          sellAmounts,
        })

        setShowTokenDetail(true)
      } else {
        showNotification("Failed to fetch token details", "error")
      }
    } catch (err) {
      console.error("[v0] Failed to fetch token:", err)
      showNotification("Failed to load token details", "error")
    }
  }

  const handleSellPositionDirectly = async (position: PositionWithPrice, amountStr: string) => {
    if (!client || isTrading) return

    let percent: number
    if (amountStr.includes("%")) {
      percent = Number.parseFloat(amountStr.replace("%", ""))
    } else {
      percent = Number.parseFloat(amountStr)
    }

    if (isNaN(percent) || percent <= 0 || percent > 100) {
      showNotification("Invalid sell amount (must be between 0-100%)", "error")
      return
    }

    setIsTrading(true)
    setIsTradingId(position.id)
    showNotification(`Processing sell ${percent}% transaction...`, "info")

    try {
      const result =
        mode === "demo"
          ? await client.demoSellToken(position.chain, position.tokenAddress, percent)
          : await client.sellToken(position.chain, position.tokenAddress, percent, 0.5)

      if (result.success) {
        showNotification("Sell transaction successful!", "success")
        await refreshData()
      } else {
        showNotification(`Sell failed: ${result.error}`, "error")
      }
    } catch (err) {
      showNotification(`Error: ${err instanceof Error ? err.message : "Unknown error"}`, "error")
    } finally {
      setIsTrading(false)
      setIsTradingId("")
    }
  }

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        console.log("[v0] === TELEGRAM MINI APP INIT WITH SDK ===")

        const savedChain = typeof window !== "undefined" ? localStorage.getItem("selectedChain") : null
        if (savedChain) {
          setSelectedChain(savedChain)
        }

        if (typeof window !== "undefined") {
          try {
            const twaModule = await import("@twa-dev/sdk")
            WebApp = twaModule.default
            WebApp.ready()
            console.log("[v0] ✓ WebApp SDK ready")
          } catch (sdkErr) {
            console.warn("[v0] WebApp SDK not available, running in demo mode")
            setError("Telegram WebApp SDK not available. Running in demo mode.")
            setLoading(false)
            return
          }
        }

        const telegramId = WebApp?.initDataUnsafe?.user?.id
        const initData = WebApp?.initData

        if (!telegramId) {
          console.error("[v0] Could not extract Telegram ID")
          setError("Could not get Telegram ID from SDK")
          setLoading(false)
          return
        }

        if (!initData) {
          console.error("[v0] Could not extract initData")
          setError("Could not get initData from SDK")
          setLoading(false)
          return
        }

        console.log("[v0] ✓ Got Telegram ID:", telegramId)
        console.log("[v0] ✓ Got initData length:", initData.length)

        const newClient = new MiniAppClient(telegramId.toString(), initData)
        setClient(newClient)

        // Load chains
        const chainsData = await newClient.getAvailableChains()
        setChains(chainsData)

        // Load user profile
        const profile = await newClient.getUserProfile()
        setUserProfile(profile)

        const chainToLoad = savedChain || "solana"
        await fetchChainData(chainToLoad, "demo", true)
        await fetchNativePrice(chainToLoad)

        const addressData = await newClient.getWalletAddress(chainToLoad)
        if (addressData.success) {
          setWalletAddress(addressData.address)
        }

        setChainLoaded(true)
        console.log("[v0] === INIT COMPLETE ===")
      } catch (err) {
        console.error("[v0] Initialization error:", err)
        setError(`Failed to initialize: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    initializeMiniApp()
  }, [])

  useEffect(() => {
    if (!client || !chainLoaded) return

    const updateChainData = async () => {
      setLoadingPositions(true)
      try {
        await fetchChainData(selectedChain, mode, false)
        await fetchNativePrice(selectedChain)

        if (typeof window !== "undefined") {
          localStorage.setItem("selectedChain", selectedChain)
        }

        if (mode === "live") {
          const addressData = await client.getWalletAddress(selectedChain)
          if (addressData.success) {
            setWalletAddress(addressData.address)
          }
        }
      } catch (err) {
        console.error("[v0] Error updating chain data:", err)
      } finally {
        setLoadingPositions(false)
      }
    }

    updateChainData()
  }, [selectedChain, mode, client, chainLoaded])

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

    const currentChain = chains.find((c) => c.key === selectedChain)
    const nativeSymbol = currentChain?.nativeToken.symbol || "SOL"

    if (client) {
      try {
        console.log(`[v0] Fetching token details for CA: ${ca} on chain: ${selectedChain}`)
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
            if (mc >= 1e3) return `$${(mc / 1e3).toFixed(1)}K`
            return `$${mc.toLocaleString()}`
          }

          const m5Change = token.change?.m5 ?? 0
          const h1Change = token.change?.h1 ?? 0
          const h24Change = token.change?.h24 ?? 0
          const h24Volume = token.volume?.h24 ?? 0

          const buyAmounts = [`0.1 ${nativeSymbol}`, `0.5 ${nativeSymbol}`, `X ${nativeSymbol}`]
          const sellAmounts = [`50%`, `100%`, `X`]

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
              liquidity: formatMarketCap(token.liquidityInUsd),
              price: `$${token.priceUsd.toFixed(4)}`,
              volume24h: formatMarketCap(h24Volume),
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
        console.error("[v0] Failed to fetch token:", err)
        setError("Failed to process contract address")
      }
    }
  }

  const currentChain = chains.find((c) => c.key === selectedChain)
  const nativeSymbol = currentChain?.nativeToken.symbol || "SOL"
  const displayBalance = mode === "demo" ? demoBalance : balance
  const usdBalance = displayBalance * nativePrice
  const displayPositions = mode === "demo" ? demoPositions : positions

  if (loading) {
    return <WalletSkeleton />
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
      <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
              notification.type === "success"
                ? "bg-green-500/90 text-white"
                : notification.type === "error"
                  ? "bg-red-500/90 text-white"
                  : "bg-blue-500/90 text-white"
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 max-w-2xl mx-auto w-full pb-40 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Image src="/images/image.png" alt="Debonk Logo" width={32} height={32} className="w-8 h-8" />
            <h1 className="text-xl font-bold text-white">Debonk</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Help"
              className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors"
            >
              <Image
                src="/images/material-symbols-light-help.png"
                alt="Help"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </button>
            <button
              aria-label="Notifications"
              className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors"
            >
              <Image
                src="/images/fluent-alert-16-filled-20-281-29.png"
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
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                mode === "demo"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A]"
              }`}
              onClick={() => setMode("demo")}
            >
              • Demo
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                mode === "live"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A]"
              }`}
              onClick={() => setMode("live")}
            >
              • Live
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-6 mb-6 overflow-hidden border border-[#252525]">
          <div className="pointer-events-none select-none absolute right-4 top-1/2 -translate-y-1/2 opacity-15">
            <Image
              src={logo || "/placeholder.svg"}
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
                  <Copy className="w-3 h-3 text-gray-400 hover:text-white transition-colors" />
                </button>
              </div>
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger className="bg-[#1A1A1A] text-white text-xs border border-[#2A2A2A] rounded px-2 py-1 w-[140px]">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border border-[#2A2A2A] text-white">
                  {chains.map((chain) => (
                    <SelectItem key={chain.key} value={chain.key} className="text-xs hover:bg-[#2A2A2A]">
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-400 mb-4">Balance ~ ${usdBalance.toFixed(2)}</p>
            <div className="flex items-baseline gap-2 mb-6">
              <h2 className="text-4xl font-bold text-white">{client?.formatBalance(displayBalance) || "0.000"}</h2>
              <span className="text-xl text-gray-400">{nativeSymbol}</span>
              <button className="cursor-pointer" onClick={refreshData}>
                <RefreshCcw className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>
            <p
              className={`text-sm font-semibold mb-6 flex items-center gap-1 ${
                balancePriceChange >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {balancePriceChange >= 0 ? "▲" : "▼"} {Math.abs(balancePriceChange).toFixed(2)}%
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowWithdrawModal(true)}
                className="flex-1 bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-xl h-11"
              >
                Withdraw
              </Button>
              <Button
                onClick={() => setShowDepositModal(true)}
                className="flex-1 bg-[#1A1A1A] hover:bg-[#252525] text-white font-semibold rounded-xl h-11 border border-[#2A2A2A]"
              >
                Deposit
              </Button>
            </div>
          </div>
        </div>

        {activeTab === "home" && (
          <>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white">Position Overview</h3>
            </div>

            <div className="space-y-3 mb-6">
              {loadingPositions ? (
                <div className="text-center text-gray-400 py-8">Loading positions...</div>
              ) : displayPositions.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No positions yet</div>
              ) : (
                displayPositions.map((position) => {
                  const priceChange24h = position.priceChange24h ?? 0
                  const positionValue = position.currentPrice
                    ? Number.parseFloat(position.amountHeld) * position.currentPrice
                    : 0
                  const isPositive = priceChange24h >= 0

                  return (
                    <div
                      key={position.id}
                      className={`border rounded-md p-4 transition-colors bg-[#1A1A1A] border-[#2A2A2A]`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => handlePositionClick(position)}
                        >
                          <div className="text-base font-semibold text-white">${position.tokenTicker}</div>
                          {position.priceChange24h !== undefined && (
                            <span
                              className={`text-xs font-medium rounded ${
                                priceChange24h >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {priceChange24h >= 0 ? "+" : ""}
                              {priceChange24h.toFixed(2)}%
                            </span>
                          )}
                        </div>
                        <Button
                          onClick={async (e) => {
                            e.stopPropagation()
                            await handleSellPositionDirectly(position, "100%")
                          }}
                          disabled={isTrading && isTradingId === position.id}
                          className="bg-[#3A3A3A] hover:bg-[#444444] text-white font-medium rounded-full px-4 h-9 text-xs disabled:opacity-50"
                        >
                          {isTrading && isTradingId === position.id ? "..." : "Sell 100%"}
                        </Button>
                      </div>
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => handlePositionClick(position)}
                      >
                        {position.marketCap && (
                          <span className="text-xs text-gray-200 bg-gray-500/20 px-2 py-1 rounded-full">
                            MC {position.marketCap}
                          </span>
                        )}
                        {positionValue > 0 && (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              priceChange24h >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            ${positionValue.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {activeTab === "futures" && <FuturesTrading />}

        {/* ... rest of existing tabs ... */}
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
              className={`absolute right-1 top-1 h-10 px-4 rounded-full border ${
                hasValidToken
                  ? "bg-[#D4AF37] hover:opacity-90 text-black font-semibold border-transparent"
                  : "bg-[#3A3A3A] hover:bg-[#444444] text-white border border-[#4A4A4A]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isTrading ? "..." : hasValidToken ? "Buy" : "Paste"}
            </Button>
          </div>
          {pasteError && <p className="text-xs text-yellow-400 mt-1 text-center">{pasteError}</p>}
        </div>
        <div className="flex items-center justify-between px-6 py-3 pb-[calc(env(safe-area-inset-bottom))] gap-2 max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab("home")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="/images/solar-home-angle-bold.png"
              alt="Home"
              width={24}
              height={24}
              className="w-6 h-6 opacity-50"
            />
            {activeTab === "home" && <div className="w-8 h-0.5 bg-[#D4AF37]"></div>}
          </button>
          <button
            onClick={() => setActiveTab("chart")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="/images/tabler-chart-candle-filled-20-281-29.png"
              alt="Charts"
              width={24}
              height={24}
              className={`w-6 h-6 ${activeTab === "chart" ? "" : "opacity-50"}`}
            />
            {activeTab === "chart" && <div className="w-8 h-0.5 bg-[#D4AF37]"></div>}
          </button>
          <button
            onClick={() => setActiveTab("futures")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <svg
              className={`w-6 h-6 ${activeTab === "futures" ? "text-[#D4AF37]" : "text-gray-500"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
              <line x1="9" y1="15" x2="15" y2="15" />
              <line x1="9" y1="11" x2="15" y2="11" />
            </svg>
            {activeTab === "futures" && <div className="w-8 h-0.5 bg-[#D4AF37]"></div>}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="/images/mingcute-settings-3-fill.png"
              alt="Settings"
              width={24}
              height={24}
              className={`w-6 h-6 ${activeTab === "settings" ? "" : "opacity-50"}`}
            />
            {activeTab === "settings" && <div className="w-8 h-0.5 bg-[#D4AF37]"></div>}
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="/images/fluent-people-32-filled-20-281-29.png"
              alt="Social"
              width={24}
              height={24}
              className={`w-6 h-6 ${activeTab === "social" ? "" : "opacity-50"}`}
            />
            {activeTab === "social" && <div className="w-8 h-0.5 bg-[#D4AF37]"></div>}
          </button>
          <button
            onClick={() => setActiveTab("help")}
            className="flex-1 flex flex-col items-center gap-1 transition-colors"
          >
            <Image
              src="/images/material-symbols-light-help.png"
              alt="Help"
              width={24}
              height={24}
              className={`w-6 h-6 ${activeTab === "help" ? "" : "opacity-50"}`}
            />
            {activeTab === "help" && <div className="w-8 h-0.5 bg-[#D4AF37]"></div>}
          </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-3 bg-black pointer-events-none z-10" />

      {/* Token Detail Modal */}
      {showTokenDetail && selectedToken && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Don't close - keep token visible
            }
          }}
        >
          <div
            className="bg-[#0F0F0F] w-full max-w-2xl rounded-t-3xl p-6 border-t border-[#252525] animate-slide-up max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{selectedToken.name}</h2>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedToken.address)
                    showNotification("CA copied!", "success")
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy contract address"
                >
                  <Image src="/images/ion-copy.png" alt="Copy" width={18} height={18} className="w-4.5 h-4.5" />
                </button>
              </div>
              <button
                onClick={() => {
                  setShowTokenDetail(false)
                }}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 text-xs">
              <span
                className={
                  selectedToken.pnlData.fiveMin.includes("-")
                    ? "text-red-400 font-semibold"
                    : "text-green-400 font-semibold"
                }
              >
                5m: {selectedToken.pnlData.fiveMin}
              </span>
              <span className="text-gray-500">|</span>
              <span
                className={
                  selectedToken.pnlData.oneHour.includes("-")
                    ? "text-red-400 font-semibold"
                    : "text-green-400 font-semibold"
                }
              >
                1hr: {selectedToken.pnlData.oneHour}
              </span>
              <span className="text-gray-500">|</span>
              <span
                className={
                  selectedToken.pnlData.twentyFourHours.includes("-")
                    ? "text-red-400 font-semibold"
                    : "text-green-400 font-semibold"
                }
              >
                24hr: {selectedToken.pnlData.twentyFourHours}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2A2A2A]">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Market Cap</div>
                <div className="text-md font-bold text-white">{selectedToken.marketData.marketCap}</div>
              </div>
              <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2A2A2A]">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Liquidity</div>
                <div className="text-md font-bold text-white">{selectedToken.marketData.liquidity}</div>
              </div>
              <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2A2A2A]">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Price</div>
                <div className="text-md font-bold text-white">{selectedToken.marketData.price}</div>
              </div>
              <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2A2A2A]">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Volume 24H</div>
                <div className="text-md font-bold text-white">{selectedToken.marketData.volume24h}</div>
              </div>
            </div>

            {displayPositions.find((p) => p.tokenAddress.toLowerCase() === selectedToken.address.toLowerCase()) ? (
              <>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Buy</h3>
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
                      <div className="flex gap-3">
                        {selectedToken.buyAmounts.map((amount, index) => (
                          <Button
                            key={index}
                            onClick={() => {
                              if (amount.startsWith("X")) {
                                setShowCustomBuyInput(true)
                              } else {
                                handleBuyWithAmount(amount)
                              }
                            }}
                            disabled={isTrading}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full h-12 disabled:opacity-50"
                          >
                            {isTrading ? "..." : amount.startsWith("X") ? `X ${nativeSymbol}` : amount}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Sell</h3>
                    {showCustomSellInput ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={customSellAmount}
                          onChange={(e) => setCustomSellAmount(e.target.value)}
                          placeholder="Amount to sell"
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
                      <div className="flex gap-3">
                        {selectedToken.sellAmounts.map((amount, index) => (
                          <Button
                            key={index}
                            onClick={() => {
                              if (amount === "X") {
                                setShowCustomSellInput(true)
                              } else {
                                handleSellWithAmount(amount)
                              }
                            }}
                            disabled={isTrading}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full h-12 disabled:opacity-50"
                          >
                            {isTrading ? "..." : amount === "X" ? "Custom" : amount}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Buy</h3>
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
                    <div className="flex gap-3">
                      {selectedToken.buyAmounts.map((amount, index) => (
                        <Button
                          key={index}
                          onClick={() => {
                            if (amount.startsWith("X")) {
                              setShowCustomBuyInput(true)
                            } else {
                              handleBuyWithAmount(amount)
                            }
                          }}
                          disabled={isTrading}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full h-12 disabled:opacity-50"
                        >
                          {isTrading ? "..." : amount.startsWith("X") ? `X ${nativeSymbol}` : amount}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        walletAddress={walletAddress}
        chainName={currentChain?.name || "Solana"}
        chainKey={selectedChain}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        walletAddress={walletAddress}
        chainName={currentChain?.name || "Solana"}
        chainKey={selectedChain}
        balance={balance}
        nativePrice={nativePrice}
        nativeSymbol={nativeSymbol}
        telegramClient={client!}
      />
    </div>
  )
}
