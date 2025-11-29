"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowUpRight, ArrowDownLeft, TrendingUp, ChevronLeft, Settings } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PerpDexProps {
  onClose: () => void
}

const generateChartData = () => {
  const basePrice = 180
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

const tradingPairs = [
  { symbol: "BTC/USD", price: 42380.5, change24h: 2.34 },
  { symbol: "ETH/USD", price: 2380.5, change24h: 1.45 },
  { symbol: "SOL/USD", price: 192.3, change24h: 5.23 },
  { symbol: "XRP/USD", price: 2.45, change24h: -1.12 },
  { symbol: "ADA/USD", price: 1.15, change24h: 0.89 },
  { symbol: "DOGE/USD", price: 0.42, change24h: -0.34 },
]

export default function PerpDex({ onClose }: PerpDexProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "trade">("chart")
  const [selectedPair, setSelectedPair] = useState("BTC/USD")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tradeMode, setTradeMode] = useState<"long" | "short" | null>(null)
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1h")
  const [leverage, setLeverage] = useState(5)
  const [stopLoss, setStopLoss] = useState<number | null>(null)
  const [takeProfit, setTakeProfit] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const chartData = generateChartData()

  const ChartPage = () => (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:px-6 border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Image src="/images/image.png" alt="Debonk Logo" width={32} height={32} className="w-8 h-8" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent">
            Perp DEX
          </h1>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Full Screen Chart */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-6 flex flex-col">
        {/* Chart Header with Token Dropdown and Settings */}
        <div className="flex items-start justify-between mb-6">
          {/* Left: Token Dropdown and Price */}
          <div className="flex-1">
            <div className="relative mb-4 w-fit">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37]/20 to-blue-500/20 border border-[#D4AF37]/50 rounded-xl hover:border-[#D4AF37] transition-all duration-300 group"
              >
                <span className="text-lg font-bold bg-gradient-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent">
                  {selectedPair}
                </span>
                <svg
                  className={`w-5 h-5 text-[#D4AF37] transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Animated Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full mt-2 w-56 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {tradingPairs.map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => {
                        setSelectedPair(pair.symbol)
                        setDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-3 flex items-center justify-between border-b border-[#2A2A2A] transition-colors last:border-b-0 ${
                        selectedPair === pair.symbol
                          ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                          : "hover:bg-[#252525] text-white"
                      }`}
                    >
                      <span className="font-semibold">{pair.symbol}</span>
                      <span className={pair.change24h >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {pair.change24h >= 0 ? "+" : ""}
                        {pair.change24h.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price and Change */}
            <div>
              <div className="flex items-baseline gap-3">
                <p className="text-5xl font-bold text-white">
                  ${tradingPairs.find((pair) => pair.symbol === selectedPair)?.price.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 bg-emerald-500/20 px-4 py-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-lg font-semibold text-emerald-400">
                    {tradingPairs.find((pair) => pair.symbol === selectedPair)?.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">24h Change</p>
            </div>
          </div>

          {/* Right: Timeframe and Settings */}
          <div className="flex flex-col items-end gap-4">
            <div className="flex gap-2">
              {(["1h", "4h", "1d", "1w"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? "bg-[#D4AF37] text-black"
                      : "bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] hover:border-[#3A3A3A]"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center hover:bg-[#252525] transition-colors text-gray-400 hover:text-[#D4AF37]"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Leverage</label>
                <div className="flex gap-1">
                  {[2, 5, 10].map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        leverage === lev
                          ? "bg-[#D4AF37] text-black"
                          : "bg-[#0A0A0A] border border-[#2A2A2A] text-gray-400 hover:border-[#3A3A3A]"
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>
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
        )}

        {/* Chart Area */}
        <div className="flex-1 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "#666", fontSize: 12 }}
                axisLine={{ stroke: "#2A2A2A" }}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 12 }}
                axisLine={{ stroke: "#2A2A2A" }}
                domain={["dataMin - 5", "dataMax + 5"]}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #2A2A2A",
                  borderRadius: "12px",
                  padding: "16px",
                }}
                labelStyle={{ color: "#D4AF37", fontSize: 14 }}
                formatter={(value: any) => [`$${value.toFixed(2)}`, "Price"]}
                cursor={{ stroke: "#D4AF37", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#D4AF37"
                strokeWidth={3}
                fill="url(#colorPrice)"
                isAnimationActive={true}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Center Balance and Long/Short buttons */}
        <div className="flex flex-col items-center gap-4">
          {/* Balance Display */}
          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-blue-500/20 border border-[#D4AF37]/50 rounded-xl px-8 py-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Available Balance</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent">
              $5,234.50
            </p>
          </div>

          {/* Long and Short Buttons */}
          <div className="flex gap-4 w-full max-w-sm">
            <Button
              onClick={() => setTradeMode("long")}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-6 font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-emerald-500/30"
            >
              <ArrowUpRight className="w-6 h-6" />
              Long
            </Button>
            <Button
              onClick={() => setTradeMode("short")}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-6 font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-red-500/30"
            >
              <ArrowDownLeft className="w-6 h-6" />
              Short
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  const TradePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 md:px-6 border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("chart")}
          className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-lg font-bold text-white">Trade {selectedPair}</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full pb-32">
        {!tradeMode ? (
          <>
            {/* Token Selection */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Select Pair</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tradingPairs.map((pair) => (
                  <div
                    key={pair.symbol}
                    onClick={() => setSelectedPair(pair.symbol)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedPair === pair.symbol
                        ? "bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]"
                        : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A]"
                    }`}
                  >
                    <p className={`font-bold ${selectedPair === pair.symbol ? "text-[#D4AF37]" : "text-white"}`}>
                      {pair.symbol}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">${pair.price.toFixed(2)}</p>
                    <p
                      className={`text-sm font-semibold mt-2 ${pair.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {pair.change24h >= 0 ? "+" : ""}
                      {pair.change24h.toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Long/Short Selection */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Position Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Long Card */}
                <div
                  onClick={() => setTradeMode("long")}
                  className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-400">Long</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                    Profit if the price goes up. Borrow assets and sell them, then buy back at a lower price.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Max Leverage: 10x</p>
                    <p className="text-xs text-gray-500">Entry: Market</p>
                  </div>
                </div>

                {/* Short Card */}
                <div
                  onClick={() => setTradeMode("short")}
                  className="bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-500/30 hover:border-red-500/60 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/20"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <ArrowDownLeft className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-400">Short</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                    Profit if the price goes down. Sell first at current price and buy back at a lower price.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Max Leverage: 10x</p>
                    <p className="text-xs text-gray-500">Entry: Market</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Trade Form */}
            <div className="max-w-md mx-auto">
              <button
                onClick={() => setTradeMode(null)}
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#E6C547] mb-6 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-2xl p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tradeMode === "long" ? "bg-emerald-500/20" : "bg-red-500/20"
                    }`}
                  >
                    {tradeMode === "long" ? (
                      <ArrowUpRight
                        className={`w-6 h-6 ${tradeMode === "long" ? "text-emerald-400" : "text-red-400"}`}
                      />
                    ) : (
                      <ArrowDownLeft
                        className={`w-6 h-6 ${tradeMode === "short" ? "text-red-400" : "text-emerald-400"}`}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Open Position</p>
                    <p className={`text-2xl font-bold ${tradeMode === "long" ? "text-emerald-400" : "text-red-400"}`}>
                      {tradeMode?.toUpperCase()} {selectedPair}
                    </p>
                  </div>
                </div>

                {/* Trade Inputs */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Collateral ($)</label>
                    <input
                      type="number"
                      placeholder="1000"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Leverage (x)</label>
                    <div className="flex gap-2 mb-2">
                      {[2, 5, 10].map((leverage) => (
                        <button
                          key={leverage}
                          className="flex-1 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white hover:bg-[#1A1A1A] transition-colors text-sm font-medium"
                        >
                          {leverage}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Position Summary */}
                <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-[#2A2A2A] mb-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Position Size</p>
                    <p className="font-semibold text-white">5.2 {selectedPair.split("/")[0]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Liquidation Price</p>
                    <p className="font-semibold text-white">$185.20</p>
                  </div>
                </div>

                {/* Trade Button */}
                <Button
                  className={`w-full py-6 font-bold text-lg rounded-xl transition-opacity ${
                    tradeMode === "long"
                      ? "bg-emerald-500 hover:opacity-90 text-white"
                      : "bg-red-500 hover:opacity-90 text-white"
                  }`}
                >
                  Open {tradeMode?.toUpperCase()} Position
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return activeTab === "chart" ? <ChartPage /> : <TradePage />
}
