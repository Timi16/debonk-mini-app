"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
  chainName: string
  chainKey: string
  balance: number
  nativePrice: number
  nativeSymbol: string
}

type WithdrawStep = "amount" | "confirm" | "success"

export function WithdrawModal({
  isOpen,
  onClose,
  walletAddress,
  chainName,
  chainKey,
  balance,
  nativePrice,
  nativeSymbol,
}: WithdrawModalProps) {
  const [step, setStep] = useState<WithdrawStep>("amount")
  const [amount, setAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionHash, setTransactionHash] = useState("")

  const amountNum = Number.parseFloat(amount) || 0
  const usdValue = amountNum * nativePrice
  const available = balance

  const handleMaxClick = () => {
    setAmount(balance.toFixed(6))
  }

  const handleContinueAmount = () => {
    if (amountNum <= 0 || amountNum > available) {
      return
    }
    setStep("confirm")
  }

  const handleConfirmWithdraw = async () => {
    if (!recipientAddress.trim()) {
      return
    }

    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setTransactionHash(`0x${Math.random().toString(16).slice(2, 66)}`)
      setStep("success")
    } catch (error) {
      console.error("Withdrawal failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setStep("amount")
    setAmount("")
    setRecipientAddress("")
    setTransactionHash("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="bg-[#0F0F0F] w-full max-w-2xl rounded-t-3xl p-6 border-t border-[#252525] animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl leading-none"
        >
          ✕
        </button>

        {/* STEP 1: Amount Input */}
        {step === "amount" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Withdraw</h2>
              <p className="text-sm text-gray-400">
                To: {walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}
              </p>
            </div>

            {/* Amount Display */}
            <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-[#2A2A2A] text-center">
              <div className="mb-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-5xl font-bold text-white text-center outline-none placeholder:text-gray-600"
                />
              </div>
              <div className="text-gray-400 text-lg mb-4">{nativeSymbol}</div>
              <div className="text-2xl font-semibold text-white">${usdValue.toFixed(2)}</div>
            </div>

            {/* MAX Button */}
            <div className="flex justify-between items-center">
              <Button
                onClick={handleMaxClick}
                className="bg-[#3A3A3A] hover:bg-[#444444] text-white font-semibold rounded-full px-6 h-10"
              >
                MAX
              </Button>
              <div className="text-sm text-gray-400">
                Available: {available.toFixed(6)} {nativeSymbol}
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinueAmount}
              disabled={amountNum <= 0 || amountNum > available}
              className="w-full bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 2: Confirm Address */}
        {step === "confirm" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Confirm Withdrawal</h2>
              <p className="text-sm text-gray-400">Review and confirm your withdrawal details</p>
            </div>

            {/* Summary */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount</span>
                <span className="text-white font-semibold">
                  {amountNum.toFixed(6)} {nativeSymbol}
                </span>
              </div>
              <div className="border-t border-[#2A2A2A]"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">USD Value</span>
                <span className="text-white font-semibold">${usdValue.toFixed(2)}</span>
              </div>
              <div className="border-t border-[#2A2A2A]"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Network</span>
                <span className="text-white font-semibold">{chainName}</span>
              </div>
            </div>

            {/* Recipient Address */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Recipient Address</label>
              <Input
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="bg-[#1A1A1A] text-white border border-[#2A2A2A] rounded-lg h-12 placeholder:text-gray-500"
              />
            </div>

            {/* Recent Addresses */}
            <div>
              <label className="text-sm font-semibold text-white mb-3 block">Recent</label>
              <button
                onClick={() => setRecipientAddress(walletAddress)}
                className="w-full bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-lg p-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">W</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Wallet</div>
                    <div className="text-gray-400 text-xs">
                      {walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setStep("amount")}
                className="flex-1 bg-[#3A3A3A] hover:bg-[#444444] text-white font-semibold rounded-xl h-12"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmWithdraw}
                disabled={!recipientAddress.trim() || isProcessing}
                className="flex-1 bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === "success" && (
          <div className="space-y-6 text-center">
            {/* Success Checkmark */}
            <div className="flex justify-center pt-8">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-pulse">
                <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Transaction Label */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Transaction</h2>
              <p className="text-sm text-gray-400">Your withdrawal has been processed</p>
            </div>

            {/* Transaction Details */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A] space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold">Sent</div>
                  <div className="text-gray-400 text-sm">
                    To: {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-4)}
                  </div>
                  <div className="text-white font-semibold mt-2">
                    ~{amountNum.toFixed(6)} {nativeSymbol}
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Hash */}
            {transactionHash && (
              <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A]">
                <div className="text-xs text-gray-400 mb-2">Transaction Hash</div>
                <div className="text-white text-xs font-mono break-all">{transactionHash}</div>
              </div>
            )}

            {/* Close Button */}
            <Button
              onClick={handleClose}
              className="w-full bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-xl h-12"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
