"use client"
import React, { useState, useEffect } from "react"
import type { MiniAppClient } from "@/lib/telegram-client"
import { PerpPriceWebSocket } from "@/lib/perps"
import type { PerpPair, PriceUpdateData, PerpPosition, PerpTradingStats } from "@/lib/types"

// ============================================
// COMPONENT-SPECIFIC TYPES
// ============================================

interface PerpDexProps {
  onClose: () => void
  telegramClient: MiniAppClient
}

interface TradingPairData {
  symbol: PerpPair
  price: number
  change24h: number
  priceHistory: number[]
}

const TRADING_PAIRS: PerpPair[] = [
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "BNB/USD",
  "DOGE/USD",
  "XRP/USD",
  "ADA/USD",
  "AVAX/USD",
  "DOT/USD",
  "MATIC/USD"
]

export default function PerpDex({ onClose, telegramClient }: PerpDexProps) {
  const wsRef = React.useRef<PerpPriceWebSocket | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  const [activeTab, setActiveTab] = useState<"chart" | "trade" | "positions">("chart")
  const [selectedPair, setSelectedPair] = useState<PerpPair>("BTC/USD")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tradeMode, setTradeMode] = useState<"long" | "short" | null>(null)
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1h")
  const [leverage, setLeverage] = useState(5)
  const [collateral, setCollateral] = useState("")
  const [stopLoss, setStopLoss] = useState<number | null>(null)
  const [takeProfit, setTakeProfit] = useState<number | null>(null)
  const [demoBalance, setDemoBalance] = useState(0)
  const [positions, setPositions] = useState<PerpPosition[]>([])
  const [tradingPairs, setTradingPairs] = useState<TradingPairData[]>([])
  const [isTrading, setIsTrading] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error" | "info"
  } | null>(null)
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([])
  const [stats, setStats] = useState<PerpTradingStats | null>(null)

  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    const initWebSocket = async () => {
      try {
        wsRef.current = new PerpPriceWebSocket("wss://77be5c75e373.ngrok-free.app", telegramClient.getTelegramId())

        await wsRef.current.connect()
        setWsConnected(true)

        wsRef.current.subscribeToPairs(TRADING_PAIRS)

        TRADING_PAIRS.forEach((pair) => {
          wsRef.current?.onPriceUpdate(pair, (data: PriceUpdateData) => {
            setTradingPairs((prev) =>
              prev.map((p) => {
                if (p.symbol === pair) {
                  const history = [...(p.priceHistory || []), data.price]
                  if (history.length > 100) history.shift()
                  return {
                    ...p,
                    price: data.price,
                    priceHistory: history,
                  }
                }
                return p
              }),
            )
          })
        })

        console.log("[v0] WebSocket initialized and subscribed to pairs")
      } catch (error) {
        console.error("[v0] WebSocket initialization error:", error)
        showNotification("Failed to connect to price feeds", "error")
      }
    }

    initWebSocket()

    return () => {
      wsRef.current?.close()
    }
  }, [])

  const generateChartData = (basePrice: number) => {
    const data = []
    for (let i = 0; i < 50; i++) {
      const randomWalk = Math.sin(i * 0.2) * 8 + Math.random() * 4
      data.push({
        time: `${12 + Math.floor(i / 4)}:${(i % 4) * 15}`,
        price: basePrice + randomWalk + i * 0.15,
      })
    }
    return data
  }

  useEffect(() => {
    const initPerps = async () => {
      try {
        const balanceData = await telegramClient.getDemoBalance("base")
        if (balanceData.success) {
          setDemoBalance(Number.parseFloat(balanceData.demoBalance))
        }

        const initialPairs: TradingPairData[] = TRADING_PAIRS.map((pair) => ({
          symbol: pair,
          price: 0,
          change24h: 0,
          priceHistory: [],
        }))
        setTradingPairs(initialPairs)

        const response = await telegramClient.getPerpPositions("OPEN")
        if (response.success && response.positions) {
          setPositions(response.positions)
        }

        const statsData = await telegramClient.getPerpTradingStats()
        if (statsData.success) {
          setStats(statsData)
        }

        setChartData(generateChartData(40000))
      } catch (error) {
        console.error("[v0] Error initializing perps:", error)
        showNotification("Failed to initialize perp trading", "error")
      }
    }

    initPerps()
  }, [telegramClient])

  useEffect(() => {
    const refreshData = async () => {
      try {
        const response = await telegramClient.getPerpPositions("OPEN")
        if (response.success && response.positions) {
          setPositions(response.positions)
        }

        const statsData = await telegramClient.getPerpTradingStats()
        if (statsData.success) {
          setStats(statsData)
        }

        const balanceData = await telegramClient.getDemoBalance("base")
        if (balanceData.success) {
          setDemoBalance(Number.parseFloat(balanceData.demoBalance))
        }
      } catch (error) {
        console.error("[v0] Error refreshing perp data:", error)
      }
    }

    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [telegramClient])

  const handleOpenPosition = async () => {
    if (!tradeMode || !collateral || isTrading) return
    const collateralNum = Number.parseFloat(collateral)
    if (isNaN(collateralNum) || collateralNum <= 0) {
      showNotification("Invalid collateral amount", "error")
      return
    }
    if (collateralNum > demoBalance) {
      showNotification("Insufficient balance", "error")
      return
    }

    const currentPrice = tradingPairs.find((p) => p.symbol === selectedPair)?.price
    if (!currentPrice || currentPrice === 0) {
      showNotification("Price not available, please wait for WebSocket update", "error")
      return
    }

    setIsTrading(true)
    showNotification("Opening position...", "info")
    try {
      const response = await telegramClient.openPerpPosition(
        selectedPair,
        tradeMode === "long",
        collateralNum,
        leverage,
        currentPrice,
        "base",
      )

      if (response.success) {
        showNotification("Position opened successfully!", "success")
        if (response.newDemoBalance) {
          setDemoBalance(Number.parseFloat(response.newDemoBalance))
        }
        setTradeMode(null)
        setCollateral("")
        setActiveTab("positions")

        const posResponse = await telegramClient.getPerpPositions("OPEN")
        if (posResponse.success && posResponse.positions) {
          setPositions(posResponse.positions)
        }
      } else {
        showNotification(`Failed to open position: ${response.error}`, "error")
      }
    } catch (error) {
      console.error("[v0] Error opening position:", error)
      showNotification("Error opening position", "error")
    } finally {
      setIsTrading(false)
    }
  }

  const handleClosePosition = async (positionId: string, position: PerpPosition) => {
    const currentPrice = tradingPairs.find((p) => p.symbol === position.pair)?.price
    if (!currentPrice || currentPrice === 0) {
      showNotification("Price not available", "error")
      return
    }

    setIsTrading(true)
    showNotification("Closing position...", "info")
    try {
      const response = await telegramClient.closePerpPosition(positionId, currentPrice)

      if (response.success) {
        const pnl = response.position?.realizedPnL ? Number.parseFloat(response.position.realizedPnL) : 0
        showNotification(
          `Position closed! PnL: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
          pnl >= 0 ? "success" : "error",
        )
        if (response.newDemoBalance) {
          setDemoBalance(Number.parseFloat(response.newDemoBalance))
        }

        const posResponse = await telegramClient.getPerpPositions("OPEN")
        if (posResponse.success && posResponse.positions) {
          setPositions(posResponse.positions)
        }

        const statsData = await telegramClient.getPerpTradingStats()
        if (statsData.success) {
          setStats(statsData)
        }
      } else {
        showNotification(`Failed to close position: ${response.error}`, "error")
      }
    } catch (error) {
      console.error("[v0] Error closing position:", error)
      showNotification("Error closing position", "error")
    } finally {
      setIsTrading(false)
    }
  }

  const handlePairChange = (pair: PerpPair) => {
    setSelectedPair(pair)
    setDropdownOpen(false)
    const pairData = tradingPairs.find((p) => p.symbol === pair)
    if (pairData && pairData.price > 0) {
      setChartData(generateChartData(pairData.price))
    }
  }

  const currentPairData = tradingPairs.find((p) => p.symbol === selectedPair)
  const currentPrice = currentPairData?.price || 0
  const change24h = currentPairData?.change24h || 0
  const positionSize = collateral ? Number.parseFloat(collateral) * leverage : 0
  const liquidationPrice = currentPrice * (tradeMode === "long" ? 0.9 : 1.1)

  const ChartPage = () => (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-3 sm:p-4 md:px-6 border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2">
            {/* Placeholder for Debonk Logo */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full"></div>
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent truncate">
              Perp DEX
            </h1>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${wsConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
          >
            {/* Placeholder for Activity Icon */}
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>{wsConnected ? "Live" : "Offline"}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1A1A1A] flex-shrink-0 flex items-center justify-center hover:bg-[#252525] transition-colors text-gray-400 hover:text-white"
        >
          {/* Placeholder for X Icon */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full"></div>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="relative mb-4 w-fit">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37]/20 to-blue-500/20 border border-[#D4AF37]/50 rounded-xl hover:border-[#D4AF37] transition-all"
              >
                <span className="font-bold bg-gradient-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent">
                  {selectedPair}
                </span>
                <svg
                  className={`w-4 h-4 text-[#D4AF37] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-2 w-56 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {tradingPairs.map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handlePairChange(pair.symbol)}
                      className={`w-full px-4 py-3 flex items-center justify-between border-b border-[#2A2A2A] transition-colors last:border-b-0 ${
                        selectedPair === pair.symbol
                          ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                          : "hover:bg-[#252525] text-white"
                      }`}
                    >
                      <span className="font-semibold">{pair.symbol}</span>
                      <span className="text-xs">${pair.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-4xl md:text-5xl font-bold text-white">${currentPrice.toFixed(2)}</p>
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                    change24h >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}
                >
                  <span className={`font-semibold ${change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {change24h >= 0 ? "+" : ""}
                    {change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {(["1h", "4h", "1d", "1w"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  timeframe === tf
                    ? "bg-[#D4AF37] text-black"
                    : "bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] hover:border-[#3A3A3A]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Open Positions</p>
            <p className="text-2xl font-bold text-white">{positions.length}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Total PnL</p>
            <p
              className={`text-2xl font-bold ${
                stats?.stats?.totalRealizedPnL && Number.parseFloat(stats.stats.totalRealizedPnL) >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              ${stats?.stats?.totalRealizedPnL ? Number.parseFloat(stats.stats.totalRealizedPnL).toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Balance</p>
            <p className="text-2xl font-bold text-white">${demoBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setTradeMode("long")
              setActiveTab("trade")
            }}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 font-bold text-lg rounded-xl transition-all"
          >
            📈 Long
          </button>
          <button
            onClick={() => {
              setTradeMode("short")
              setActiveTab("trade")
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 font-bold text-lg rounded-xl transition-all"
          >
            📉 Short
          </button>
        </div>
      </div>
    </div>
  )

  const TradePage = () => (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-4">
      {tradeMode && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  tradeMode === "long" ? "bg-emerald-500/20" : "bg-red-500/20"
                }`}
              >
                <span className="text-xl">{tradeMode === "long" ? "📈" : "📉"}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Open Position</p>
                <p className={`text-2xl font-bold ${tradeMode === "long" ? "text-emerald-400" : "text-red-400"}`}>
                  {tradeMode?.toUpperCase()} {selectedPair}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Collateral ($)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                />
                <p className="text-xs text-gray-500 mt-1">Available: ${demoBalance.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Leverage</label>
                <div className="flex gap-2">
                  {[2, 5, 10].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        leverage === lev
                          ? "bg-[#D4AF37] text-black"
                          : "bg-[#0A0A0A] border border-[#2A2A2A] text-white hover:bg-[#1A1A1A]"
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Stop Loss ($)</label>
                  <input
                    type="number"
                    placeholder="Min price"
                    value={stopLoss || ""}
                    onChange={(e) => setStopLoss(e.target.value ? Number.parseFloat(e.target.value) : null)}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Take Profit ($)</label>
                  <input
                    type="number"
                    placeholder="Max price"
                    value={takeProfit || ""}
                    onChange={(e) => setTakeProfit(e.target.value ? Number.parseFloat(e.target.value) : null)}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-[#2A2A2A] mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Position Size</p>
                <p className="font-semibold text-white">${positionSize.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Liquidation Price</p>
                <p className="font-semibold text-white">${liquidationPrice.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={handleOpenPosition}
              disabled={isTrading || !collateral}
              className={`w-full py-4 font-bold text-lg rounded-xl transition-opacity disabled:opacity-50 ${
                tradeMode === "long"
                  ? "bg-emerald-500 hover:opacity-90 text-white"
                  : "bg-red-500 hover:opacity-90 text-white"
              }`}
            >
              {isTrading ? "Opening..." : `Open ${tradeMode?.toUpperCase()} Position`}
            </button>
          </div>
        </div>
      )}

      {!tradeMode && (
        <div className="max-w-md mx-auto">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                <strong className="text-emerald-400">Long:</strong> Profit when price goes up. You're betting the asset
                will increase.
              </p>
              <p>
                <strong className="text-red-400">Short:</strong> Profit when price goes down. You're betting the asset
                will decrease.
              </p>
              <p>
                <strong className="text-[#D4AF37]">Leverage:</strong> Multiply your position size. Higher leverage =
                higher risk and reward.
              </p>
              <p className="text-yellow-400 pt-2">⚠️ This is demo mode. No real funds at risk.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const PositionsPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
        <h1 className="text-lg font-bold text-white">Open Positions</h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525]"
        >
          {/* Placeholder for X Icon */}
          <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-lg font-semibold mb-2">No open positions</p>
            <p className="text-sm">Start trading to open positions</p>
          </div>
        ) : (
          positions.map((position) => (
            <div key={position.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#D4AF37]">{position.pair}</p>
                  <p className="text-sm text-gray-400">
                    {position.isLong ? "📈 Long" : "📉 Short"} • {position.leverage}x
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${position.status === "OPEN" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}`}
                >
                  {position.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Entry Price</p>
                  <p className="font-semibold text-white">${Number.parseFloat(position.entryPrice).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Position Size</p>
                  <p className="font-semibold text-white">${Number.parseFloat(position.positionSize).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Collateral</p>
                  <p className="font-semibold text-white">${Number.parseFloat(position.collateral).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Current PnL</p>
                  <p
                    className={`font-semibold ${Number.parseFloat(position.currentPnL) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {Number.parseFloat(position.currentPnL) >= 0 ? "+" : ""}$
                    {Number.parseFloat(position.currentPnL).toFixed(2)}
                  </p>
                </div>
              </div>

              {position.status === "OPEN" && (
                <button
                  onClick={() => handleClosePosition(position.id, position)}
                  disabled={isTrading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {isTrading ? "Processing..." : "Close Position"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      {notification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500/90"
              : notification.type === "error"
                ? "bg-red-500/90"
                : "bg-blue-500/90"
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex border-b border-[#2A2A2A]">
        {(["chart", "trade", "positions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-semibold text-sm uppercase tracking-wider transition-colors ${
              activeTab === tab ? "text-[#D4AF37] border-b-2 border-[#D4AF37]" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "chart" && <ChartPage />}
        {activeTab === "trade" && <TradePage />}
        {activeTab === "positions" && <PositionsPage />}
      </div>
    </div>
  )
}
