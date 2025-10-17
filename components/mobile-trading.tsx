"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useWalletBalance, usePositions, useChains } from "../hooks/useWallet"

export function MobileTrading() {
  const [activeTab, setActiveTab] = useState("home")
  const [mode, setMode] = useState<"demo" | "live">("demo")
  const [tokenInput, setTokenInput] = useState("")
  const [selectedChain, setSelectedChain] = useState("solana")
  const [telegramId, setTelegramId] = useState<string>("")
  
  // Fetch chains
  const { chains } = useChains()
  
  // Get telegramId from Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const user = tg.initDataUnsafe?.user
      if (user?.id) {
        setTelegramId(user.id.toString())
      }
    } else {
      // Fallback for testing
      setTelegramId("123456789")
    }
  }, [])
  
  // Fetch wallet balance and positions
  const { balance, loading: balanceLoading, error: balanceError, refetch: refetchBalance } = useWalletBalance(
    telegramId,
    selectedChain
  )
 
  const { positions, loading: positionsLoading, error: positionsError, refetch: refetchPositions } = usePositions(
    telegramId,
    selectedChain
  )
  
  // Format balance display
  const formatBalance = (bal: number | undefined) => {
    if (bal === undefined) return "0.000"
    if (bal === 0) return "0.000"
    if (bal < 0.001) return bal.toFixed(6)
    if (bal < 1) return bal.toFixed(4)
    return bal.toFixed(3)
  }
  
  // Get chain symbol
  const getChainSymbol = () => {
    const chain = chains.find(c => c.key === selectedChain)
    return chain?.nativeToken?.symbol || "SOL"
  }
  
  // Format USD value
  const formatUSD = (value: number) => {
    if (value === 0) return "$0.00"
    if (value < 0.01) return `$${value.toFixed(4)}`
    return `$${value.toFixed(2)}`
  }
  
  // Calculate position change (mock for now - you'll need price data)
  const calculatePositionChange = (position: any) => {
    // TODO: Fetch current price and calculate actual PnL
    const randomChange = (Math.random() * 200 - 100).toFixed(2)
    return {
      change: `${randomChange}%`,
      isPositive: parseFloat(randomChange) > 0
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Main Content */}
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
            {/* Chain Selector */}
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-[#1A1A1A] text-white text-xs px-3 py-2 rounded-lg border border-[#2A2A2A] hover:bg-[#252525] transition-colors"
            >
              {chains.map((chain) => (
                <option key={chain.key} value={chain.key}>
                  {chain.name}
                </option>
              ))}
            </select>
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
            <div
              onClick={() => setMode("demo")}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                mode === "demo"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A]"
              }`}
            >
              • Demo
            </div>
            <div
              onClick={() => setMode("live")}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                mode === "live"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-[#1A1A1A] text-gray-300 border border-[#2A2A2A]"
              }`}
            >
              • Live
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-6 mb-6 overflow-hidden border border-[#252525]">
          {/* Debonk watermark logo on the right */}
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
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-400">Main Wallet</span>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ion_copy-tN5Kmg8bxbyMQVDSbLbfeMkejTdvGp.png"
                alt="Copy"
                width={14}
                height={14}
                className="w-3.5 h-3.5 opacity-50 cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {balanceLoading ? "Loading..." : balanceError ? "Error loading balance" : `Balance ~ ${formatUSD(balance?.balance || 0)}`}
            </p>
            <div className="flex items-baseline gap-2 mb-6">
              <h2 className="text-4xl font-bold text-white">
                {balanceLoading ? "..." : formatBalance(balance?.balance)}
              </h2>
              <span className="text-xl text-gray-400">{getChainSymbol()}</span>
              <button onClick={refetchBalance} disabled={balanceLoading}>
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector%20%281%29-gWZ2CwEa51DiP49O5aKvC3WvEZ6Wpf.png"
                  alt="Refresh"
                  width={16}
                  height={16}
                  className={`w-4 h-4 ml-1 opacity-50 cursor-pointer hover:opacity-100 transition-opacity ${balanceLoading ? 'animate-spin' : ''}`}
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

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Position Overview</h3>
          <button
            onClick={refetchPositions}
            disabled={positionsLoading}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {positionsLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {positionsLoading ? (
            <div className="text-center text-gray-400 py-8">Loading positions...</div>
          ) : positionsError ? (
            <div className="text-center text-red-400 py-8">Error: {positionsError}</div>
          ) : positions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No positions found</div>
          ) : (
            positions.map((position) => {
              const { change, isPositive } = calculatePositionChange(position)
              return (
                <div key={position.id} className="bg-[#111111] border border-[#252525] rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="text-base font-semibold text-white">{position.tokenTicker}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-[10px] leading-none bg-[#1E1E1E] text-gray-300 border border-[#2A2A2A]">
                          {position.amountHeld} tokens
                        </span>
                        <span className="px-2 py-1 rounded-full text-[10px] leading-none bg-[#1E1E1E] text-gray-300 border border-[#2A2A2A]">
                          Avg: ${parseFloat(position.avgBuyPrice).toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                        {change}
                      </span>
                      <Button className="bg-[#3A3A3A] hover:bg-[#444444] text-white text-sm h-9 px-5 rounded-full font-medium shadow-inner border border-[#444444]">
                        Sell 100%
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      
      <div className="fixed bottom-3 left-0 right-0 bg-black border-t border-[#1A1A1A] shadow-[0_-8px_16px_rgba(0,0,0,0.35)] z-20 pb-5">
        {/* Joined Contract Address/Token Input */}
        <div className="px-6 pt-4 max-w-2xl mx-auto">
          <div className="relative">
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Contract Address or Token"
              className="bg-[#1A1A1A] text-white placeholder:text-gray-500 rounded-full h-12 pr-24 pl-4 border border-[color:rgba(212,175,55,0.2)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
            />
            <Button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.readText().then(text => {
                    setTokenInput(text)
                  }).catch(err => {
                    console.error('Failed to read clipboard:', err);
                  });
                }
              }}
              className="absolute right-1 top-1 bg-[#3A3A3A] hover:bg-[#444444] text-white text-sm h-10 px-4 rounded-full border border-[#4A4A4A]"
            >
              Paste
            </Button>
          </div>
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
              className={`w-6 h-6 ${activeTab === "home" ? "" : "opacity-50"}`}
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
      
      {/* Bottom background fill to cover gap to screen edge */}
      <div className="fixed bottom-0 left-0 right-0 h-3 bg-black pointer-events-none z-10" />
    </div>
  )
}