"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
  chainName: string
  balance: number
  nativeSymbol: string
  nativePrice: number
}

export function WithdrawModal({
  isOpen,
  onClose,
  walletAddress,
  chainName,
  balance,
  nativeSymbol,
  nativePrice,
}: WithdrawModalProps) {
  const [step, setStep] = useState<"amount" | "confirm">("amount")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [selectedAddress, setSelectedAddress] = useState(walletAddress)
  const [customAddress, setCustomAddress] = useState("")
  const [showCustomAddress, setShowCustomAddress] = useState(false)

  if (!isOpen) return null

  const amount = Number.parseFloat(withdrawAmount) || 0
  const usdValue = amount * nativePrice
  const maxAmount = balance

  const handleMaxClick = () => {
    setWithdrawAmount(maxAmount.toFixed(6))
  }

  const handleContinue = () => {
    if (amount <= 0 || amount > maxAmount) {
      return
    }
    setStep("confirm")
  }

  const handleConfirm = () => {
    // TODO: Implement actual withdrawal logic
    console.log("Withdrawing", amount, nativeSymbol, "to", selectedAddress)
    onClose()
    setStep("amount")
    setWithdrawAmount("")
    setCustomAddress("")
    setShowCustomAddress(false)
  }

  const handleBack = () => {
    setStep("amount")
  }

  const recentAddresses = [{ label: "Wallet", address: walletAddress }]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div
        className="bg-[#0F0F0F] w-full max-w-2xl rounded-t-3xl p-6 border-t border-[#252525] animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {step === "confirm" && (
              <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ion_copy-tN5Kmg8bxbyMQVDSbLbfeMkejTdvGp.png"
                  alt="Back"
                  width={20}
                  height={20}
                  className="w-5 h-5 rotate-180"
                />
              </button>
            )}
            <h2 className="text-2xl font-bold text-white">{step === "amount" ? "Withdraw" : "Confirm"}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">
            ✕
          </button>
        </div>

        {/* Amount Step */}
        {step === "amount" && (
          <div className="space-y-6">
            {/* To Address Display */}
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">To: {chainName}</div>
              <div className="text-sm text-gray-300 font-mono truncate">{walletAddress}</div>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A] text-center">
                <div className="text-sm text-gray-400 mb-4">Amount</div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-5xl font-bold text-white text-center outline-none w-full"
                    step="0.000001"
                    min="0"
                    max={maxAmount}
                  />
                  <span className="text-3xl text-gray-400">{nativeSymbol}</span>
                </div>
                <div className="text-sm text-gray-400 mb-6">${usdValue.toFixed(2)}</div>

                {/* MAX Button */}
                <button
                  onClick={handleMaxClick}
                  className="px-4 py-2 bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-lg text-sm transition-opacity"
                >
                  MAX
                </button>
              </div>

              {/* Available Balance */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Available</span>
                <span>
                  {maxAmount.toFixed(6)} {nativeSymbol}
                </span>
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={amount <= 0 || amount > maxAmount}
              className="w-full bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && (
          <div className="space-y-6">
            {/* Amount Summary */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A] text-center">
              <div className="text-sm text-gray-400 mb-2">Withdrawing</div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-white">{amount.toFixed(6)}</span>
                <span className="text-2xl text-gray-400">{nativeSymbol}</span>
              </div>
              <div className="text-sm text-gray-400">${usdValue.toFixed(2)}</div>
            </div>

            {/* Address Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Recipient Address</h3>

              {/* Recent Addresses */}
              <div className="space-y-2">
                {recentAddresses.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedAddress(item.address)
                      setShowCustomAddress(false)
                    }}
                    className={`w-full p-4 rounded-xl border transition-colors text-left ${
                      selectedAddress === item.address
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]"
                        : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A]"
                    }`}
                  >
                    <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                    <div className="text-sm text-white font-mono truncate">{item.address}</div>
                  </button>
                ))}
              </div>

              {/* Custom Address Input */}
              {showCustomAddress ? (
                <div className="space-y-2">
                  <Input
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Enter wallet address"
                    className="bg-[#1A1A1A] text-white border border-[#2A2A2A] rounded-lg h-12"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (customAddress.trim()) {
                          setSelectedAddress(customAddress)
                          setShowCustomAddress(false)
                        }
                      }}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg h-10"
                    >
                      Confirm
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCustomAddress(false)
                        setCustomAddress("")
                      }}
                      className="flex-1 bg-[#3A3A3A] hover:bg-[#444444] text-white font-semibold rounded-lg h-10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomAddress(true)}
                  className="w-full p-4 rounded-xl border border-dashed border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors text-center"
                >
                  <div className="text-sm text-gray-400">+ Add Address</div>
                </button>
              )}
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleConfirm}
              className="w-full bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-xl h-12"
            >
              Confirm Withdrawal
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
