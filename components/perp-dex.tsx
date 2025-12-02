"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ChevronLeft,
  Settings,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MiniAppClient } from "@/lib/telegram-client";
import { PerpPriceWebSocket } from "@/lib/perps";
import type { PerpPair, PerpPosition } from "@/lib/types";

interface PerpDexProps {
  onClose: () => void;
  telegramClient: MiniAppClient;
}

// Supported trading pairs
const TRADING_PAIRS: Array<{
  symbol: PerpPair;
  initialPrice: number;
}> = [
  { symbol: "BTC/USD", initialPrice: 42380.5 },
  { symbol: "ETH/USD", initialPrice: 2380.5 },
  { symbol: "SOL/USD", initialPrice: 192.3 },
  { symbol: "XRP/USD", initialPrice: 2.45 },
  { symbol: "ADA/USD", initialPrice: 1.15 },
  { symbol: "DOGE/USD", initialPrice: 0.42 },
];

interface TradingPairData {
  symbol: PerpPair;
  price: number;
  change24h: number;
}

export default function PerpDex({ onClose, telegramClient }: PerpDexProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "trade">("chart");
  const [selectedPair, setSelectedPair] = useState<PerpPair>("BTC/USD");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState<"long" | "short" | null>(null);
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1h");
  const [leverage, setLeverage] = useState(5);
  const [collateral, setCollateral] = useState("");
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [demoBalance, setDemoBalance] = useState(0);
  const [positions, setPositions] = useState<PerpPosition[]>([]);
  const [tradingPairs, setTradingPairs] = useState<TradingPairData[]>([]);
  const [isTrading, setIsTrading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [priceWs, setPriceWs] = useState<PerpPriceWebSocket | null>(null);
  const [chartData, setChartData] = useState<
    Array<{ time: string; price: number }>
  >([]);
  const [stats, setStats] = useState<any>(null);

  // Show notification
  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Generate initial chart data
  const generateChartData = useCallback((basePrice: number) => {
    const data = [];
    for (let i = 0; i < 50; i++) {
      const randomWalk = Math.sin(i * 0.2) * 8 + Math.random() * 4;
      data.push({
        time: `${12 + Math.floor(i / 4)}:${(i % 4) * 15}`,
        price: basePrice + randomWalk + i * 0.15,
      });
    }
    return data;
  }, []);

  // Initialize WebSocket and load data
  useEffect(() => {
    const initPerps = async () => {
      try {
        // Initialize price WebSocket
        const ws = new PerpPriceWebSocket(
          "https://8988e8ca4a74.ngrok-free.app",
          telegramClient.getTelegramId?.() || undefined
        );

        await ws.connect();
        setPriceWs(ws);

        // Subscribe to all trading pairs
        ws.subscribeToPairs(TRADING_PAIRS.map((p) => p.symbol));

        // Initialize trading pairs with default prices
        const initialPairs = TRADING_PAIRS.map((pair) => ({
          symbol: pair.symbol,
          price: pair.initialPrice,
          change24h: 0,
        }));
        setTradingPairs(initialPairs);

        // Set up price update listeners
        TRADING_PAIRS.forEach((pair) => {
          ws.onPriceUpdate(pair.symbol, (data) => {
            setTradingPairs((prev) =>
              prev.map((p) =>
                p.symbol === pair.symbol
                  ? {
                      ...p,
                      price: data.price,
                      change24h:
                        ((data.price - pair.initialPrice) /
                          pair.initialPrice) *
                        100,
                    }
                  : p
              )
            );

            // Update chart if this is the selected pair
            if (pair.symbol === selectedPair) {
              setChartData((prev) => {
                const newData = [
                  ...prev.slice(-49),
                  {
                    time: new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    price: data.price,
                  },
                ];
                return newData;
              });
            }
          });
        });

        // Load demo balance
        const balanceData = await telegramClient.getDemoBalance("base");
        if (balanceData.success) {
          setDemoBalance(parseFloat(balanceData.demoBalance));
        }

        // Load positions
        await loadPositions();

        // Load stats
        await loadStats();

        // Initialize chart for selected pair
        const initialPair = TRADING_PAIRS.find((p) => p.symbol === selectedPair);
        if (initialPair) {
          setChartData(generateChartData(initialPair.initialPrice));
        }
      } catch (error) {
        console.error("Error initializing perps:", error);
        showNotification("Failed to initialize perp trading", "error");
      }
    };

    initPerps();

    // Cleanup on unmount
    return () => {
      if (priceWs) {
        priceWs.close();
      }
    };
  }, [telegramClient, generateChartData]);

  // Load positions
  const loadPositions = async () => {
    try {
      const response = await telegramClient.getPerpPositions("OPEN");
      if (response.success && response.positions) {
        setPositions(response.positions);
      }
    } catch (error) {
      console.error("Error loading positions:", error);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const statsData = await telegramClient.getPerpTradingStats();
      if (statsData.success) {
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Open position
  const handleOpenPosition = async () => {
    if (!tradeMode || !collateral || isTrading) return;

    const collateralNum = parseFloat(collateral);
    if (isNaN(collateralNum) || collateralNum <= 0) {
      showNotification("Invalid collateral amount", "error");
      return;
    }

    if (collateralNum > demoBalance) {
      showNotification("Insufficient balance", "error");
      return;
    }

    const currentPrice = tradingPairs.find((p) => p.symbol === selectedPair)?.price;
    if (!currentPrice) {
      showNotification("Price not available", "error");
      return;
    }

    setIsTrading(true);
    showNotification("Opening position...", "info");

    try {
      const response = await telegramClient.openPerpPosition(
        selectedPair,
        tradeMode === "long",
        collateralNum,
        leverage,
        currentPrice,
        "base"
      );

      if (response.success) {
        showNotification("Position opened successfully!", "success");

        // Update balance
        if (response.newDemoBalance) {
          setDemoBalance(parseFloat(response.newDemoBalance));
        }

        // Reload positions
        await loadPositions();
        await loadStats();

        // Reset form
        setTradeMode(null);
        setCollateral("");
        setActiveTab("chart");
      } else {
        showNotification(`Failed to open position: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("Error opening position:", error);
      showNotification("Error opening position", "error");
    } finally {
      setIsTrading(false);
    }
  };

  // Close position
  const handleClosePosition = async (positionId: string) => {
    const currentPrice = tradingPairs.find((p) => p.symbol === selectedPair)?.price;
    if (!currentPrice) {
      showNotification("Price not available", "error");
      return;
    }

    setIsTrading(true);
    showNotification("Closing position...", "info");

    try {
      const response = await telegramClient.closePerpPosition(
        positionId,
        currentPrice
      );

      if (response.success) {
        const pnl = response.position?.realizedPnL
          ? parseFloat(response.position.realizedPnL)
          : 0;
        showNotification(
          `Position closed! PnL: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
          pnl >= 0 ? "success" : "error"
        );

        // Update balance
        if (response.newDemoBalance) {
          setDemoBalance(parseFloat(response.newDemoBalance));
        }

        // Reload positions
        await loadPositions();
        await loadStats();
      } else {
        showNotification(`Failed to close position: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("Error closing position:", error);
      showNotification("Error closing position", "error");
    } finally {
      setIsTrading(false);
    }
  };

  // Change selected pair
  const handlePairChange = (pair: PerpPair) => {
    setSelectedPair(pair);
    setDropdownOpen(false);

    // Generate new chart data for this pair
    const pairData = TRADING_PAIRS.find((p) => p.symbol === pair);
    if (pairData) {
      setChartData(generateChartData(pairData.initialPrice));
    }
  };

  const currentPairData = tradingPairs.find((p) => p.symbol === selectedPair);
  const currentPrice = currentPairData?.price || 0;
  const change24h = currentPairData?.change24h || 0;

  const positionSize = collateral ? parseFloat(collateral) * leverage : 0;
  const liquidationPrice = currentPrice * (tradeMode === "long" ? 0.9 : 1.1);

  const ChartPage = () => (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:px-6 border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ukVZDkLcTHvqwsfUVjBuRXDRQpqQGp.png"
            alt="Debonk Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <h1 className="text-lg font-bold bg-gradient-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent">
            Perp DEX
          </h1>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500/90 text-white"
              : notification.type === "error"
              ? "bg-red-500/90 text-white"
              : "bg-blue-500/90 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Full Screen Chart */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] p-6 flex flex-col">
        {/* Chart Header */}
        <div className="flex items-start justify-between mb-6">
          {/* Left: Token Dropdown and Price */}
          <div className="flex-1">
            <div className="relative mb-4 w-fit">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37]/20 to-blue-500/20 border border-[#D4AF37]/50 rounded-xl hover:border-[#D4AF37] transition-all duration-300"
              >
                <span className="text-lg font-bold bg-gradient-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent">
                  {selectedPair}
                </span>
                <svg
                  className={`w-5 h-5 text-[#D4AF37] transition-transform duration-300 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full mt-2 w-56 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {tradingPairs.map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handlePairChange(pair.symbol)}
                      className={`w-full px-4 py-3 flex items-center justify-between border-b border-[#2A2A2A] transition-colors last:border-b-0 ${
                        selectedPair === pair.symbol
                          ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                          : "hover:bg-[#252525] text-white"
                      }`}
                    >
                      <span className="font-semibold">{pair.symbol}</span>
                      <span
                        className={
                          pair.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                        }
                      >
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
                  ${currentPrice.toFixed(2)}
                </p>
                <div
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg ${
                    change24h >= 0
                      ? "bg-emerald-500/20"
                      : "bg-red-500/20"
                  }`}
                >
                  <TrendingUp
                    className={`w-5 h-5 ${
                      change24h >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  />
                  <span
                    className={`text-lg font-semibold ${
                      change24h >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {change24h >= 0 ? "+" : ""}
                    {change24h.toFixed(2)}%
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
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Leverage
                </label>
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
                <label className="block text-xs text-gray-400 mb-2">
                  Stop Loss ($)
                </label>
                <input
                  type="number"
                  placeholder="Min price"
                  value={stopLoss || ""}
                  onChange={(e) =>
                    setStopLoss(
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Take Profit ($)
                </label>
                <input
                  type="number"
                  placeholder="Max price"
                  value={takeProfit || ""}
                  onChange={(e) =>
                    setTakeProfit(
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Chart Area */}
        <div className="flex-1 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2A2A2A"
                vertical={false}
              />
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

        {/* Stats and Positions Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Open Positions</p>
            <p className="text-2xl font-bold text-white">
              {positions.length}
            </p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Total PnL</p>
            <p
              className={`text-2xl font-bold ${
                stats?.stats?.totalRealizedPnL &&
                parseFloat(stats.stats.totalRealizedPnL) >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {stats?.stats?.totalRealizedPnL
                ? `$${parseFloat(stats.stats.totalRealizedPnL).toFixed(2)}`
                : "$0.00"}
            </p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Balance</p>
            <p className="text-2xl font-bold text-white">
              ${demoBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Long and Short Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => {
              setTradeMode("long");
              setActiveTab("trade");
            }}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-6 font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-emerald-500/30"
          >
            <ArrowUpRight className="w-6 h-6" />
            Long
          </Button>
          <Button
            onClick={() => {
              setTradeMode("short");
              setActiveTab("trade");
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-6 font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-red-500/30"
          >
            <ArrowDownLeft className="w-6 h-6" />
            Short
          </Button>
        </div>
      </div>
    </div>
  );

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
        <h1 className="text-lg font-bold text-white">
          {tradeMode ? `${tradeMode.toUpperCase()} ${selectedPair}` : "Trade"}
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full pb-32">
        {/* Open Positions */}
        {positions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
              Open Positions
            </h2>
            <div className="space-y-3">
              {positions.map((position) => {
                const pairPrice = tradingPairs.find(
                  (p) => p.symbol === position.pair
                )?.price;
                const entryPrice = parseFloat(position.entryPrice);
                const pnl = pairPrice
                  ? (position.isLong
                      ? pairPrice - entryPrice
                      : entryPrice - pairPrice) *
                    parseFloat(position.positionSize)
                  : 0;

                return (
                  <div
                    key={position.id}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {position.pair}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            position.isLong
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {position.isLong ? "LONG" : "SHORT"} {position.leverage}x
                        </span>
                      </div>
                      <Button
                        onClick={() => handleClosePosition(position.id)}
                        disabled={isTrading}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1 rounded-full disabled:opacity-50"
                      >
                        {isTrading ? "..." : "Close"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Entry</p>
                        <p className="text-white font-medium">
                          ${entryPrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Current</p>
                        <p className="text-white font-medium">
                          ${pairPrice?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">PnL</p>
                        <p
                          className={`font-bold ${
                            pnl >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trade Form */}
        {tradeMode && (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-2xl p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
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

              {/* Trade Inputs */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Collateral ($)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={collateral}
                    onChange={(e) => setCollateral(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: ${demoBalance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Leverage (x)
                  </label>
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

              {/* Position Summary */}
              <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-[#2A2A2A] mb-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Position Size</p>
                  <p className="font-semibold text-white">
                    ${positionSize.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Liquidation Price</p>
                  <p className="font-semibold text-white">
                    ${liquidationPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Trade Button */}
              <Button
                onClick={handleOpenPosition}
                disabled={isTrading || !collateral}
                className={`w-full py-6 font-bold text-lg rounded-xl transition-opacity disabled:opacity-50 ${
                  tradeMode === "long"
                    ? "bg-emerald-500 hover:opacity-90 text-white"
                    : "bg-red-500 hover:opacity-90 text-white"
                }`}
              >
                {isTrading
                  ? "Opening..."
                  : `Open ${tradeMode?.toUpperCase()} Position`}
              </Button>
            </div>
          </div>
        )}

        {/* Trading Info */}
        {!tradeMode && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                <strong className="text-emerald-400">Long:</strong> Profit when
                price goes up. You're betting the asset will increase in value.
              </p>
              <p>
                <strong className="text-red-400">Short:</strong> Profit when
                price goes down. You're betting the asset will decrease in value.
              </p>
              <p>
                <strong className="text-[#D4AF37]">Leverage:</strong> Multiply
                your position size. Higher leverage = higher risk and reward.
              </p>
              <p className="text-yellow-400">
                ⚠️ This is demo mode. No real funds at risk.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return activeTab === "chart" ? <ChartPage /> : <TradePage />;
}