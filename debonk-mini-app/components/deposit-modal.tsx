"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import QRCode from "qrcode"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
  chainName: string
  chainKey: string
}

export function DepositModal({ isOpen, onClose, walletAddress, chainName, chainKey }: DepositModalProps) {
  const [qrCode, setQrCode] = useState<string>("")

  // Generate QR code when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      QRCode.toDataURL(walletAddress, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url: string) => setQrCode(url))
        .catch((err: Error) => console.error("QR Code generation error:", err))
    }
  }, [walletAddress])

  const handleShare = async () => {
    const shareText = `Deposit to my ${chainName} wallet: ${walletAddress}`

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Deposit Address",
          text: shareText,
        })
      } catch (err) {
        console.error("Share error:", err)
        // Fallback to copy
        navigator.clipboard.writeText(walletAddress)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(walletAddress)
    }
  }

  const handleCopyAddress = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(walletAddress)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="bg-[#0F0F0F] w-full max-w-2xl rounded-t-3xl p-6 border-t border-[#252525] animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Deposit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">
            ✕
          </button>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center mb-8">
          {qrCode ? (
            <div className="relative w-64 h-64 bg-white rounded-2xl p-4 flex items-center justify-center border-2 border-[#D4AF37]">
              <Image
                src={qrCode || "/placeholder.svg"}
                alt="Wallet QR Code"
                width={240}
                height={240}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-[#1A1A1A] rounded-2xl flex items-center justify-center border-2 border-[#2A2A2A]">
              <div className="text-gray-400">Generating QR Code...</div>
            </div>
          )}
        </div>

        {/* Chain and Address Info */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Your {chainName} Address</h3>
            <p className="text-xs text-gray-500 mb-4">Receive tokens using this address as your deposit address</p>
          </div>

          {/* Address Display */}
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A] mb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-mono text-white break-all">{walletAddress}</p>
              <button
                onClick={handleCopyAddress}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                title="Copy address"
              >
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ion_copy-tN5Kmg8bxbyMQVDSbLbfeMkejTdvGp.png"
                  alt="Copy"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleShare}
            className="flex-1 bg-[#D4AF37] hover:opacity-90 text-black font-semibold rounded-xl h-12"
          >
            Share
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-[#1A1A1A] hover:bg-[#252525] text-white font-semibold rounded-xl h-12 border border-[#2A2A2A]"
          >
            Close
          </Button>
        </div>

        {/* Warning Message */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Only send {chainName} tokens to this address. Sending other assets may result in permanent loss.
          </p>
        </div>
      </div>
    </div>
  )
}