"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown } from "lucide-react"

export default function FuturesTrading() {
  const [positionType, setPositionType] = useState<"long" | "short">("long")
  const [leverage, setLeverage] = useState(2)
  const [collateral, setCollateral] = useState("100")
  const [entryPrice, setEntryPrice] = useState("45230.50")
  const [takeProfitPrice, setTakeProfitPrice] = useState("46500")
  const [stopLossPrice, setStopLossPrice] = useState("44000")
  const [openPositions, setOpenPositions] = useState([
    {
      id: 1,
      symbol: "BTC/USD",
      type: "long",
      entry: "45230.50",
      current: "46100.00",
      collateral: 100,
      leverage: 2, // Updated leverage value
      pnl: "+1870.00",
      pnlPercent: "+4.14%",
    },
  ])

  const calculatePotentialReturn = () => {
    const col = Number.parseFloat(collateral) || 0
    return (col * leverage).toFixed(2)
  }

  const handleOpenPosition = () => {
    console.log("Opening position:", {
      type: positionType,
      leverage,
      collateral,
      entry: entryPrice,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Futures Trading</h2>
        <p className="text-sm text-gray-400">Trade with leverage and manage long/short positions</p>
      </div>

      {/* Position Type Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setPositionType("long")}
          className={`py-4 px-4 rounded-lg border-2 transition-all ${
            positionType === "long" ? "border-green-500 bg-green-500/10" : "border-gray-700 bg-gray-900/50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="font-semibold">{positionType === "long" ? "LONG" : "Go Long"}</span>
          </div>
        </button>
        <button
          onClick={() => setPositionType("short")}
          className={`py-4 px-4 rounded-lg border-2 transition-all ${
            positionType === "short" ? "border-red-500 bg-red-500/10" : "border-gray-700 bg-gray-900/50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="font-semibold">{positionType === "short" ? "SHORT" : "Go Short"}</span>
          </div>
        </button>
      </div>

      {/* Trading Parameters Card */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 space-y-4">
        {/* Leverage Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-300">Leverage</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#D4AF37]">{leverage}x</span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={leverage}
            onChange={(e) => setLeverage(Number.parseInt(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1x</span>
            <span>20x</span>
          </div>
        </div>

        {/* Collateral Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Collateral (SOL)</label>
          <div className="relative">
            <Input
              type="number"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              placeholder="Enter amount"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors">
              Max
            </button>
          </div>
        </div>

        {/* Potential Return */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Potential Position Size</span>
            <span className="text-lg font-bold text-[#D4AF37]">{calculatePotentialReturn()} SOL</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {collateral} SOL × {leverage}x leverage
          </p>
        </div>
      </div>

      {/* Entry & Exit Prices */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Entry Price</label>
          <Input
            type="text"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="0.00"
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-11"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Take Profit</label>
            <Input
              type="text"
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(e.target.value)}
              placeholder="0.00"
              className="bg-green-900/20 border-green-800 text-green-400 placeholder:text-green-700 h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Stop Loss</label>
            <Input
              type="text"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(e.target.value)}
              placeholder="0.00"
              className="bg-red-900/20 border-red-800 text-red-400 placeholder:text-red-700 h-11"
            />
          </div>
        </div>
      </div>

      {/* Open Position Button */}
      <Button
        onClick={handleOpenPosition}
        className={`w-full h-12 text-lg font-semibold rounded-lg transition-all ${
          positionType === "long"
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        Open {positionType.toUpperCase()} Position
      </Button>

      {/* Open Positions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Open Positions</h3>
        <div className="space-y-3">
          {openPositions.map((position) => (
            <div
              key={position.id}
              className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3 hover:border-gray-700 transition-colors"
            >
              {/* Header Row */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{position.symbol}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        position.type === "long" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {position.type === "long" ? "LONG" : "SHORT"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{position.leverage} leverage</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${position.pnl.includes("+") ? "text-green-400" : "text-red-400"}`}>
                    {position.pnl}
                  </p>
                  <p className="text-xs text-gray-500">{position.pnlPercent}</p>
                </div>
              </div>

              {/* Pricing Row */}
              <div className="grid grid-cols-3 gap-3 bg-gray-800/30 rounded-lg p-3">
                <div>
                  <p className="text-xs text-gray-500">Entry</p>
                  <p className="text-sm font-semibold text-white">${position.entry}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-sm font-semibold text-[#D4AF37]">${position.current}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Collateral</p>
                  <p className="text-sm font-semibold text-white">{position.collateral} SOL</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button className="bg-gray-700 hover:bg-gray-600 text-white h-9 text-sm" variant="outline">
                  Close 50%
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white h-9 text-sm" variant="outline">
                  Close All
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State (if no positions) */}
      {openPositions.length === 0 && (
        <div className="bg-gray-900/50 border border-dashed border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">No open positions</p>
          <p className="text-sm text-gray-500">Open your first futures position using the controls above</p>
        </div>
      )}
    </div>
  )
}

