"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowUpRight, ArrowDownLeft, TrendingUp, ChevronLeft, Settings, X } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { PerpPriceWebSocket } from "../lib/perps" // Import the real WebSocket class
import type { PerpPosition, PriceUpdateData } from "../lib/types" // Import relevant types

interface PerpDexProps {
  onClose: () => void
  telegramClient: any
}

interface TradingPairData {
  symbol: string
  price: number
  change24h: number
}

const TRADING_PAIRS = [
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "XRP/USD",
  "ADA/USD",
  "DOGE/USD",
] as const // Use supported pairs without hardcoded initial prices

export default function PerpDex({ onClose, telegramClient }: PerpDexProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "trade">("chart")
  const [selectedPair, setSelectedPair] = useState<string>("BTC/USD")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tradeMode, setTradeMode] = useState<"long" | "short" | null>(null)
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1h")
  const [leverage, setLeverage] = useState(5)
  const [collateral, setCollateral] = useState("")
  const [stopLoss, setStopLoss] = useState<number | null>(null)
  const [takeProfit, setTakeProfit] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [demoBalance, setDemoBalance] = useState(0)
  const [positions, setPositions] = useState<PerpPosition[]>([])
  const [tradingPairs, setTradingPairs] = useState<TradingPairData[]>([])
  const [isTrading, setIsTrading] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error" | "info"
  } | null>(null)
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([])
  const [stats, setStats] = useState<any>(null)
  const priceWsRef = useRef<PerpPriceWebSocket | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const priceHistoryRef = useRef<Map<string, { price: number; timestamp: number }[]>>(new Map())

  const showNotification = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // Update chart when selected pair changes
  useEffect(() => {
    const history = priceHistoryRef.current.get(selectedPair) || []
    const newChartData = history.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: item.price,
    }))
    setChartData(newChartData)
  }, [selectedPair])

  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const backendUrl = telegramClient.backendUrl || "https://5bc58216ecea.ngrok-free.app"
        const telegramId = telegramClient.getTelegramId()
        
        priceWsRef.current = new PerpPriceWebSocket(backendUrl, telegramId)
        
        await priceWsRef.current.connect()
        setWsConnected(true)
        
        // Subscribe to all trading pairs
        const pairs = TRADING_PAIRS as unknown as any[] // Type assertion for union to array
        priceWsRef.current.subscribeToPairs(pairs)
        
        // Fetch initial prices for each pair
        pairs.forEach((pair) => {
          priceWsRef.current?.getPrice(pair)
        })
        
        // Set up price update callbacks for each pair
        pairs.forEach((pair) => {
          priceWsRef.current?.onPriceUpdate(pair, (data: PriceUpdateData) => {
            setTradingPairs((prev) => 
              prev.map((p) => {
                if (p.symbol === pair) {
                  const oldPrice = p.price
                  const newPrice = data.price
                  const change24h = oldPrice === 0 ? 0 : ((newPrice - oldPrice) / oldPrice) * 100
                  
                  // Store price in history for chart updates
                  const history = priceHistoryRef.current.get(pair) || []
                  history.push({ price: newPrice, timestamp: data.timestamp })
                  if (history.length > 50) history.shift()
                  priceHistoryRef.current.set(pair, history)
                  
                  return {
                    ...p,
                    price: newPrice,
                    change24h: change24h,
                  }
                }
                return p
              })
            )
          })
        })
        
        showNotification("Connected to live prices", "success")
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error)
        showNotification("Failed to connect to live prices", "error")
        setWsConnected(false)
      }
    }

    initWebSocket()

    return () => {
      if (priceWsRef.current) {
        priceWsRef.current.close()
        priceWsRef.current = null
      }
    }
  }, [telegramClient, showNotification])

  useEffect(() => {
    const initPerps = async () => {
      try {
        const balanceData = await telegramClient.getDemoBalance("base")
        if (balanceData.success) {
          setDemoBalance(Number.parseFloat(balanceData.demoBalance))
        }

        const initialPairs = TRADING_PAIRS.map((symbol) => ({
          symbol,
          price: 0,
          change24h: 0,
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
      } catch (error) {
        console.error("Error initializing perps:", error)
        showNotification("Failed to initialize perp trading", "error")
      }
    }

    initPerps()
  }, [telegramClient, showNotification])

  const handleOpenPosition = async () => {
    if (!tradeMode || !collateral) return

    setIsTrading(true)
    try {
      const entryPrice = tradingPairs.find((p) => p.symbol === selectedPair)?.price
      if (!entryPrice) {
        throw new Error("Current price not available")
      }

      const response = await telegramClient.openPerpPosition(
        selectedPair,
        tradeMode === "long",
        Number(collateral),
        leverage,
        entryPrice
      )

      if (response.success && response.position) {
        setPositions((prev) => [...prev, response.position])
        setDemoBalance(Number(response.newDemoBalance || demoBalance - Number(collateral)))
        showNotification("Position opened successfully", "success")
        setTradeMode(null)
        setCollateral("")
      } else {
        showNotification(response.error || "Failed to open position", "error")
      }
    } catch (error: any) {
      showNotification(error.message || "Error opening position", "error")
    } finally {
      setIsTrading(false)
    }
  }

  const handleClosePosition = async (positionId: string) => {
    setIsTrading(true)
    try {
      const pairPrice = tradingPairs.find((p) => p.symbol === positions.find((pos) => pos.id === positionId)?.pair)?.price
      if (!pairPrice) {
        throw new Error("Current price not available")
      }

      const response = await telegramClient.closePerpPosition(positionId, pairPrice)

      if (response.success && response.position) {
        setPositions((prev) => prev.filter((p) => p.id !== positionId))
        setDemoBalance(Number(response.newDemoBalance || demoBalance))
        showNotification("Position closed successfully", "success")
      } else {
        showNotification(response.error || "Failed to close position", "error")
      }
    } catch (error: any) {
      showNotification(error.message || "Error closing position", "error")
    } finally {
      setIsTrading(false)
    }
  }

  const positionSize = Number(collateral) * leverage
  const currentPrice = tradingPairs.find((p) => p.symbol === selectedPair)?.price || 0
  const liquidationPrice =
    tradeMode === "long"
      ? currentPrice * (1 - 1 / leverage)
      : currentPrice * (1 + 1 / leverage)

  const ChartPage = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-grow">
        <div className="mb-4">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="price" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={() => setTradeMode("long")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl"
          >
            LONG
          </Button>
          <Button
            onClick={() => setTradeMode("short")}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl"
          >
            SHORT
          </Button>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-4">
          <h2 className="text-lg font-bold text-white mb-3">Trading Pairs</h2>
          <div className="space-y-2">
            {tradingPairs.map((pair) => (
              <div
                key={pair.symbol}
                onClick={() => setSelectedPair(pair.symbol)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  selectedPair === pair.symbol ? "bg-[#2A2A2A]" : "hover:bg-[#2A2A2A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Image src={`/icons/${pair.symbol.split('/')[0].toLowerCase()}.png`} alt="" width={24} height={24} />
                  <span className="font-medium text-white">{pair.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">${pair.price.toFixed(2)}</p>
                  <p className={`${pair.change24h >= 0 ? "text-emerald-400" : "text-red-400"} text-sm`}>
                    {pair.change24h >= 0 ? "+" : ""}{pair.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const TradePage = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setActiveTab("chart")}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold text-white">Trade</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="mb-4">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Balance</span>
            <span className="font-medium text-white">${demoBalance.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Pair</span>
            <Button variant="ghost" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {selectedPair} <ChevronLeft className="h-4 w-4 ml-2 rotate-[-90deg]" />
            </Button>
          </div>
        </div>
      </div>

      {positions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Open Positions</h2>
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