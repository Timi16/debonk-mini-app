"use client"

import { Button } from "@/components/ui/button"

interface TokenDetailModalProps {
  isOpen: boolean
  onClose: () => void
  tokenName: string
  tokenSymbol: string
  pnlData: {
    fiveMin: string
    oneHour: string
    twentyFourHours: string
  }
  marketData: {
    marketCap: string
    liquidity: string
    price: string
    volume24h: string
  }
  buyAmounts: string[]
}

export function TokenDetailModal({
  isOpen,
  onClose,
  tokenName,
  tokenSymbol,
  pnlData,
  marketData,
  buyAmounts,
}: TokenDetailModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#252525] rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center">
              <span className="text-sm font-bold text-white">{tokenSymbol.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{tokenName}</h2>
              <p className="text-xs text-gray-400">{tokenSymbol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#252525] text-gray-300 px-2 py-1 rounded">PNL Card</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center hover:bg-[#2A2A2A] transition-colors"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>
        </div>

        {/* PNL Metrics */}
        <div className="mb-6 pb-4 border-b border-[#252525]">
          <p className="text-xs text-gray-400 mb-2">Performance</p>
          <div className="flex gap-4 text-sm">
            <span className={`${pnlData.fiveMin.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              5m: {pnlData.fiveMin}
            </span>
            <span className={`${pnlData.oneHour.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              1hr: {pnlData.oneHour}
            </span>
            <span className={`${pnlData.twentyFourHours.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              24hrs: {pnlData.twentyFourHours}
            </span>
          </div>
        </div>

        {/* Market Data Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#0F0F0F] rounded-2xl p-4 border border-[#252525]">
            <p className="text-xs text-gray-400 mb-2">MARKET CAP</p>
            <p className="text-xl font-bold text-white">{marketData.marketCap}</p>
          </div>
          <div className="bg-[#0F0F0F] rounded-2xl p-4 border border-[#252525]">
            <p className="text-xs text-gray-400 mb-2">LIQUIDITY</p>
            <p className="text-xl font-bold text-white">{marketData.liquidity}</p>
          </div>
          <div className="bg-[#0F0F0F] rounded-2xl p-4 border border-[#252525]">
            <p className="text-xs text-gray-400 mb-2">PRICE</p>
            <p className="text-xl font-bold text-white">{marketData.price}</p>
          </div>
          <div className="bg-[#0F0F0F] rounded-2xl p-4 border border-[#252525]">
            <p className="text-xs text-gray-400 mb-2">VOLUME 24H</p>
            <p className="text-xl font-bold text-white">{marketData.volume24h}</p>
          </div>
        </div>

        {/* Buy Amount Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {buyAmounts.map((amount, index) => (
            <Button
              key={index}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full h-12"
            >
              {amount}
            </Button>
          ))}
        </div>

        {/* Action Icons */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#252525]">
          <button className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center hover:bg-[#2A2A2A] transition-colors">
            <span className="text-lg">↗</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center hover:bg-[#2A2A2A] transition-colors">
            <span className="text-lg">×</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center hover:bg-[#2A2A2A] transition-colors">
            <span className="text-lg">🔗</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center hover:bg-[#2A2A2A] transition-colors">
            <span className="text-lg">▶</span>
          </button>
        </div>
      </div>
    </div>
  )
}