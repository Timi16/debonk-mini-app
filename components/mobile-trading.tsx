"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

const positions = [
  { name: "SEclipse", mc: "$3165", value: "$3,165", change: "-98%", isPositive: false },
  { name: "SEclipse", mc: "$3165", value: "$3,165", change: "-98%", isPositive: false },
  { name: "SEclipse", mc: "$3165", value: "$3,165", change: "+98%", isPositive: true },
  { name: "SEclipse", mc: "$3165", value: "$3,165", change: "+98%", isPositive: true },
]

export function MobileTrading() {
  const [activeTab, setActiveTab] = useState("home")
  const [mode, setMode] = useState<"demo" | "live">("demo")

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 max-w-2xl mx-auto w-full pb-24 pt-6">
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
            <button className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fluent_alert-16-filled%20%281%29-7YZCWgx5VvVWw3txTFGlwTEnmh6kOr.png"
                alt="Notifications"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </button>
            <button className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors">
              <div className="w-6 h-6 rounded-full bg-[#2A2A2A]" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setMode("demo")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === "demo"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-[#1A1A1A] text-gray-400 border border-transparent"
            }`}
          >
            Demo
          </button>
          <button
            onClick={() => setMode("live")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === "live"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-[#1A1A1A] text-gray-400 border border-transparent"
            }`}
          >
            Live
          </button>
        </div>

        <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-6 mb-6 overflow-hidden border border-[#252525]">
          {/* Decorative circular pattern */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 opacity-10">
            <div className="w-full h-full rounded-full border-4 border-yellow-500/30" />
            <div className="absolute inset-4 rounded-full border-4 border-yellow-500/20" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-400">Main Wallet</span>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ion_copy-tN5Kmg8bxbyMQVDSbLbfeMkejTdvGp.png"
                alt="Copy"
                width={14}
                height={14}
                className="w-3.5 h-3.5 opacity-50"
              />
            </div>
            <p className="text-xs text-gray-500 mb-4">Balance</p>
            <div className="flex items-baseline gap-2 mb-6">
              <h2 className="text-4xl font-bold text-white">0.000</h2>
              <span className="text-xl text-gray-400">SOL</span>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Vector%20%281%29-gWZ2CwEa51DiP49O5aKvC3WvEZ6Wpf.png"
                alt="Refresh"
                width={16}
                height={16}
                className="w-4 h-4 ml-1 opacity-50"
              />
            </div>
            <p className="text-sm text-emerald-400 mb-6">≈ $0.00</p>

            <div className="flex gap-3">
              <Button className="flex-1 bg-[#D4AF37] hover:bg-[#C4A030] text-black font-semibold rounded-xl h-11">
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
          {positions.map((position, index) => (
            <div key={index} className="bg-[#1A1A1A] border border-[#252525] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">{position.name}</h4>
                  <p className="text-xs text-gray-500">MC {position.mc}</p>
                </div>
                <span className={`text-sm font-medium ${position.isPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {position.change}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-semibold ${position.isPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {position.value}
                </span>
                <Button className="bg-[#252525] hover:bg-[#2A2A2A] text-white text-sm h-9 px-6 rounded-xl font-medium">
                  Sell 100%
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <Input
            placeholder="Contract Address or Token"
            className="bg-[#1A1A1A] border-[#252525] text-white placeholder:text-gray-500 rounded-xl h-12 pr-20"
          />
          <Button className="absolute right-1 top-1 bg-[#252525] hover:bg-[#2A2A2A] text-white text-sm h-10 px-4 rounded-lg">
            Paste
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F0F0F] border-t border-[#1A1A1A]">
        <div className="flex items-center justify-around px-6 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "home" ? "opacity-100" : "opacity-40"
            }`}
          >
            <Image
              src={
                activeTab === "home"
                  ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/solar_home-angle-bold-gR7dSmS8rT7GwQLgLNyDy791PEvoKp.png"
                  : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/solar_home-angle-bold-gR7dSmS8rT7GwQLgLNyDy791PEvoKp.png"
              }
              alt="Home"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
          <button
            onClick={() => setActiveTab("chart")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "chart" ? "opacity-100" : "opacity-40"
            }`}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tabler_chart-candle-filled%20%281%29-GPtKvusIcPlwkcQG7W0WfjGM8i9RdR.png"
              alt="Charts"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "settings" ? "opacity-100" : "opacity-40"
            }`}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mingcute_settings-3-fill-Yb8fxgG1M6J2IVENmtTeQxHJFaHX88.png"
              alt="Settings"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "social" ? "opacity-100" : "opacity-40"
            }`}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fluent_people-32-filled%20%281%29-brNvHlXOEiC63RCEkMnGTIjSKrl8Tr.png"
              alt="Social"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
          <button
            onClick={() => setActiveTab("help")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "help" ? "opacity-100" : "opacity-40"
            }`}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/material-symbols-light_help-wzZ3QyqUPIVgaNK2vj5Hj5spBBxnwv.png"
              alt="Help"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
        </div>
      </div>
    </div>
  )
}
