"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowUpRight, ArrowDownLeft, TrendingUp, ChevronLeft, Settings, X, ChevronDown } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PerpDexProps {
  onClose: () => void
  telegramClient: any
}

interface TradingPairData {
  symbol: string
  price: number
  change24h: number
}

export default function PerpDex({ onClose, telegramClient }: PerpDexProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "trade">("chart")
  const [selectedPair, setSelectedPair] = useState<string>("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tradeMode, setTradeMode] = useState<"long" | "short" | null>(null)
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1h")
  const [leverage, setLeverage] = useState(5)
  const [collateral, setCollateral] = useState("")
  const [stopLoss, setStopLoss] = useState<number | null>(null)
  const [takeProfit, setTakeProfit] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [demoBalance, setDemoBalance] = useState(0)
  const [positions, setPositions] = useState<any[]>([])
  const [tradingPairs, setTradingPairs] = useState<TradingPairData[]>([])
  const [isTrading, setIsTrading] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error" | "info"
  } | null>(null)
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([])
  const [stats, setStats] = useState<any>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isClosedManuallyRef = useRef(false)
  const priceHistoryRef = useRef<Map<string, {price: number; timestamp: number}[]>>(new Map())
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const showNotification = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // WebSocket connection logic
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return
    }

    if (isConnecting) {
      return
    }

    setIsConnecting(true)
    isClosedManuallyRef.current = false

    const backendUrl = telegramClient.backendUrl || "https://5bc58216ecea.ngrok-free.app"
    const wsUrl = backendUrl.replace("https://", "wss://").replace("http://", "ws://") + "/prices"

    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      console.log("✅ Connected to perp price WebSocket")
      setWsConnected(true)
      setIsConnecting(false)
      reconnectAttemptsRef.current = 0
      showNotification("Connected to live prices", "success")
    }

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const pair = message.symbol
        const newPrice = parseFloat(message.price)

        if (pair && !isNaN(newPrice)) {
          setTradingPairs((prev) => {
            const exists = prev.find((p) => p.symbol === pair)
            if (exists) {
              return prev.map((p) =>
                p.symbol === pair
                  ? {
                      ...p,
                      change24h: ((newPrice - p.price) / p.price) * 100,
                      price: newPrice,
                    }
                  : p
              )
            } else {
              return [
                ...prev,
                {
                  symbol: pair,
                  price: newPrice,
                  change24h: 0,
                },
              ]
            }
          })

          const history = priceHistoryRef.current.get(pair) || []
          history.push({ price: newPrice, timestamp: Date.now() })
          if (history.length > 50) history.shift()
          priceHistoryRef.current.set(pair, history)

          if (pair === selectedPair) {
            setChartData(
              history.map((h) => ({
                time: new Date(h.timestamp).toLocaleTimeString(),
                price: h.price,
              }))
            )
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error("❌ WebSocket error:", error)
      setIsConnecting(false)
      setWsConnected(false)
      showNotification("Failed to connect to live prices", "error")
    }

    wsRef.current.onclose = () => {
      console.log("🔌 WebSocket connection closed")
      setWsConnected(false)
      setIsConnecting(false)

      if (!isClosedManuallyRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++
        console.log(`🔄 Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
        setTimeout(connect, reconnectDelay)
      }
    }
  }, [isConnecting, selectedPair, showNotification])

  useEffect(() => {
    connect()

    return () => {
      isClosedManuallyRef.current = true
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      priceHistoryRef.current.clear()
    }
  }, [connect])

  // Update chart when selected pair changes
  useEffect(() => {
    const history = priceHistoryRef.current.get(selectedPair) || []
    setChartData(
      history.map((h) => ({
        time: new Date(h.timestamp).toLocaleTimeString(),
        price: h.price,
      }))
    )
  }, [selectedPair])

  // Set default selected pair when pairs become available
  useEffect(() => {
    if (tradingPairs.length > 0 && !selectedPair) {
      setSelectedPair(tradingPairs[0].symbol)
    }
  }, [tradingPairs, selectedPair])

  useEffect(() => {
    const initPerps = async () => {
      try {
        const balanceData = await telegramClient.getDemoBalance("base")
        if (balanceData.success) {
          setDemoBalance(Number.parseFloat(balanceData.demoBalance))
        }

        const response = await telegramClient.getPerpPositions("OPEN")
        if (response.success && response.positions) {
          setPositions(response.positions)
        }

        const statsData = await telegramClient.getPerpTradingStats()
        if (statsData.success) {
          setStats(statsData)
        }
      } catch (error) {
        console.error("Error initializing perps:", error)
        showNotification("Failed to initialize perp trading", "error")
      }
    }

    initPerps()
  }, [telegramClient, showNotification])

  const handleOpenPosition = useCallback(async () => {
    setIsTrading(true)
    try {
      const pairPrice = tradingPairs.find((p) => p.symbol === selectedPair)?.price
      if (!pairPrice) {
        throw new Error("No current price available for the selected pair")
      }

      const response = await telegramClient.openPerpPosition(
        selectedPair,
        tradeMode === "long",
        Number(collateral),
        leverage,
        pairPrice
      )

      if (response.success) {
        setDemoBalance(Number.parseFloat(response.newDemoBalance || "0"))
        const positionsResponse = await telegramClient.getPerpPositions("OPEN")
        setPositions(positionsResponse.positions || [])
        const statsResponse = await telegramClient.getPerpTradingStats()
        setStats(statsResponse || null)
        showNotification("Position opened successfully", "success")
        setTradeMode(null)
        setCollateral("")
      } else {
        showNotification(response.error || "Failed to open position", "error")
      }
    } catch (error) {
      console.error("Error opening position:", error)
      showNotification("Error opening position", "error")
    } finally {
      setIsTrading(false)
    }
  }, [tradeMode, selectedPair, collateral, leverage, telegramClient, showNotification, tradingPairs])

  const handleClosePosition = useCallback(async (positionId: string) => {
    setIsTrading(true)
    try {
      const position = positions.find((p) => p.id === positionId)
      if (!position) throw new Error("Position not found")

      const pairPrice = tradingPairs.find((p) => p.symbol === position.pair)?.price
      if (!pairPrice) throw new Error("No current price available")

      const response = await telegramClient.closePerpPosition(positionId, pairPrice)

      if (response.success) {
        setDemoBalance(Number.parseFloat(response.newDemoBalance || "0"))
        const positionsResponse = await telegramClient.getPerpPositions("OPEN")
        setPositions(positionsResponse.positions || [])
        const statsResponse = await telegramClient.getPerpTradingStats()
        setStats(statsResponse || null)
        showNotification("Position closed successfully", "success")
      } else {
        showNotification(response.error || "Failed to close position", "error")
      }
    } catch (error) {
      console.error("Error closing position:", error)
      showNotification("Error closing position", "error")
    } finally {
      setIsTrading(false)
    }
  }, [positions, tradingPairs, telegramClient, showNotification])

  const positionSize = leverage * Number(collateral || 0)
  const pairPrice = tradingPairs.find((p) => p.symbol === selectedPair)?.price || 0
  const liquidationPrice =
    tradeMode === "long"
      ? pairPrice * (1 - 1 / leverage)
      : pairPrice * (1 + 1 / leverage)

  const ChartPage = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="text-xl font-bold">{selectedPair}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {tradingPairs.length === 0 ? (
                  <p className="p-4 text-gray-400">Connecting to price feed...</p>
                ) : (
                  tradingPairs.map((pair) => (
                    <div
                      key={pair.symbol}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer"
                      onClick={() => {
                        setSelectedPair(pair.symbol)
                        setDropdownOpen(false)
                      }}
                    >
                      <span className="font-medium">{pair.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span>${pair.price.toFixed(2)}</span>
                        <span
                          className={`text-sm ${
                            pair.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {pair.change24h >= 0 ? "+" : ""}
                          {pair.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 bg-[#0A0A0A] rounded-2xl p-4 mb-4">
        <div className="flex justify-between mb-2">
          <div className="flex gap-2">
            {["1h", "4h", "1d", "1w"].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                className="text-sm"
                onClick={() => setTimeframe(tf as any)}
              >
                {tf.toUpperCase()}
              </Button>
            ))}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${pairPrice.toFixed(2)}</p>
            <p
              className={`text-sm ${
                (tradingPairs.find((p) => p.symbol === selectedPair)?.change24h ?? 0) >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {(tradingPairs.find((p) => p.symbol === selectedPair)?.change24h ?? 0).toFixed(2)}%
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="time" stroke="#666" />
            <YAxis domain={["auto", "auto"]} stroke="#666" />
            <Tooltip
              contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}
              itemStyle={{ color: "#fff" }}
            />
            <Area type="monotone" dataKey="price" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trade Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => setTradeMode("long")}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6 rounded-xl"
        >
          LONG
        </Button>
        <Button
          onClick={() => setTradeMode("short")}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-6 rounded-xl"
        >
          SHORT
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-6">
          <h3 className="text-lg font-bold mb-3">Trading Stats</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Total Positions</p>
              <p className="font-medium">{stats.totalPositions}</p>
            </div>
            <div>
              <p className="text-gray-400">Open Positions</p>
              <p className="font-medium">{stats.openPositions}</p>
            </div>
            <div>
              <p className="text-gray-400">Realized PnL</p>
              <p className="font-medium">${stats.totalRealizedPnL}</p>
            </div>
            <div>
              <p className="text-gray-400">Unrealized PnL</p>
              <p className="font-medium">${stats.currentUnrealizedPnL}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const TradePage = () => (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setActiveTab("chart")}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Trade</h1>
        <div />
      </div>

      {/* Balance */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-6">
        <p className="text-gray-400 text-sm mb-1">Demo Balance</p>
        <p className="text-2xl font-bold">${demoBalance.toFixed(2)}</p>
      </div>

      {/* Positions */}
      {positions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Open Positions</h2>
          <div className="space-y-3">
            {positions.map((position) => {
              const pairPrice = tradingPairs.find((p) => p.symbol === position.pair)?.price
              const entryPrice = Number.parseFloat(position.entryPrice)
              const pnl = pairPrice
                ? (position.isLong ? pairPrice - entryPrice : entryPrice - pairPrice) *
                  Number.parseFloat(position.positionSize)
                : 0
              return (
                <div key={position.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg font-bold text-white truncate">{position.pair}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${
                          position.isLong ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {position.isLong ? "LONG" : "SHORT"} {position.leverage}x
                      </span>
                    </div>
                    <Button
                      onClick={() => handleClosePosition(position.id)}
                      disabled={isTrading}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1 rounded-full disabled:opacity-50 flex-shrink-0"
                    >
                      {isTrading ? "..." : "Close"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Entry</p>
                      <p className="text-white font-medium">${entryPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">Current</p>
                      <p className="text-white font-medium">${pairPrice?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5">PnL</p>
                      <p className={`font-bold ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tradeMode && (
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${
                  tradeMode === "long" ? "bg-emerald-500/20" : "bg-red-500/20"
                }`}
              >
                {tradeMode === "long" ? (
                  <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ArrowDownLeft className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">Open Position</p>
                <p
                  className={`text-2xl font-bold ${
                    tradeMode === "long" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
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
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                />
                <p className="text-xs text-gray-500 mt-1">Available: ${demoBalance.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Leverage (x)</label>
                <div className="flex gap-2 mb-2">
                  {[2, 5, 10].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`flex-1 py-2 rounded-lg transition-colors text-sm font-medium ${
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
            </div>

            <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-[#2A2A2A] mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Position Size</p>
                <p className="font-semibold text-white text-base">${positionSize.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Liquidation Price</p>
                <p className="font-semibold text-white text-base">${liquidationPrice.toFixed(2)}</p>
              </div>
            </div>

            <Button
              onClick={handleOpenPosition}
              disabled={isTrading || !collateral}
              className={`w-full py-6 font-bold text-lg rounded-xl transition-opacity disabled:opacity-50 ${
                tradeMode === "long"
                  ? "bg-emerald-500 hover:opacity-90 text-white"
                  : "bg-red-500 hover:opacity-90 text-white"
              }`}
            >
              {isTrading ? "Opening..." : `Open ${tradeMode?.toUpperCase()} Position`}
            </Button>
          </div>
        </div>
      )}

      {!tradeMode && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
          <div className="space-y-4 text-sm text-gray-300">
            <p>
              <strong className="text-emerald-400">Long:</strong> Profit when price goes up. You're betting the asset
              will increase in value.
            </p>
            <p>
              <strong className="text-red-400">Short:</strong> Profit when price goes down. You're betting the asset
              will decrease in value.
            </p>
            <p>
              <strong className="text-[#D4AF37]">Leverage:</strong> Multiply your position size. Higher leverage =
              higher risk and reward.
            </p>
            <p className="text-yellow-400">⚠️ This is demo mode. No real funds at risk.</p>
          </div>
        </div>
      )}
    </div>
  )

  return activeTab === "chart" ? <ChartPage /> : <TradePage />
}