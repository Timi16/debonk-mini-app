'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Settings,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PerpDexProps {
  onClose: () => void;
  telegramClient: any;
}

interface TradingPairData {
  symbol: string;
  price: number;
  change24h: number;
}

const TRADING_PAIRS = [
  { symbol: 'BTC/USD', initialPrice: 42380.5 },
  { symbol: 'ETH/USD', initialPrice: 2380.5 },
  { symbol: 'SOL/USD', initialPrice: 192.3 },
  { symbol: 'XRP/USD', initialPrice: 2.45 },
  { symbol: 'ADA/USD', initialPrice: 1.15 },
  { symbol: 'DOGE/USD', initialPrice: 0.42 },
];

const POSITION_SIZES = [50, 100, 250, 500, 1000];
const LEVERAGE_OPTIONS = [2, 5, 10, 15, 20];

export default function PerpDex({ onClose, telegramClient }: PerpDexProps) {
  const [selectedPair, setSelectedPair] = useState<string>('BTC/USD');
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [showPositionDetails, setShowPositionDetails] = useState(false);
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('1h');
  const [leverage, setLeverage] = useState(10);
  const [positionSize, setPositionSize] = useState(500);
  const [demoBalance, setDemoBalance] = useState(0);
  const [positions, setPositions] = useState<any[]>([]);
  const [tradingPairs, setTradingPairs] = useState<TradingPairData[]>([]);
  const [isTrading, setIsTrading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [chartData, setChartData] = useState<
    Array<{ time: string; price: number }>
  >([]);
  const [stats, setStats] = useState<any>(null);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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

  useEffect(() => {
    const initPerps = async () => {
      try {
        const balanceData = await telegramClient.getDemoBalance('base');
        if (balanceData.success) {
          setDemoBalance(Number.parseFloat(balanceData.demoBalance));
        }

        const initialPairs = TRADING_PAIRS.map((pair) => ({
          symbol: pair.symbol,
          price: pair.initialPrice,
          change24h: 0,
        }));
        setTradingPairs(initialPairs);

        const response = await telegramClient.getPerpPositions('OPEN');
        if (response.success && response.positions) {
          setPositions(response.positions);
        }

        const statsData = await telegramClient.getPerpTradingStats();
        if (statsData.success) {
          setStats(statsData);
        }

        const initialPair = TRADING_PAIRS.find(
          (p) => p.symbol === selectedPair
        );
        if (initialPair) {
          setChartData(generateChartData(initialPair.initialPrice));
        }
      } catch (error) {
        console.error('Error initializing perps:', error);
        showNotification('Failed to initialize perp trading', 'error');
      }
    };

    initPerps();
  }, [telegramClient, selectedPair, generateChartData]);

  const handleOpenPosition = async (isLong: boolean) => {
    if (isTrading) return;
    if (positionSize > demoBalance) {
      showNotification('Insufficient balance', 'error');
      return;
    }

    const currentPrice = tradingPairs.find(
      (p) => p.symbol === selectedPair
    )?.price;
    if (!currentPrice) {
      showNotification('Price not available', 'error');
      return;
    }

    setIsTrading(true);
    showNotification('Opening position...', 'info');
    try {
      const response = await telegramClient.openPerpPosition(
        selectedPair,
        isLong,
        positionSize,
        leverage,
        currentPrice,
        'base'
      );
      if (response.success) {
        showNotification('Position opened successfully!', 'success');
        if (response.newDemoBalance) {
          setDemoBalance(Number.parseFloat(response.newDemoBalance));
        }
        const updatedPositions = await telegramClient.getPerpPositions('OPEN');
        if (updatedPositions.success && updatedPositions.positions) {
          setPositions(updatedPositions.positions);
        }
      } else {
        showNotification(`Failed to open position: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error opening position:', error);
      showNotification('Error opening position', 'error');
    } finally {
      setIsTrading(false);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    const currentPrice = tradingPairs.find(
      (p) => p.symbol === selectedPair
    )?.price;
    if (!currentPrice) {
      showNotification('Price not available', 'error');
      return;
    }

    setIsTrading(true);
    showNotification('Closing position...', 'info');
    try {
      const response = await telegramClient.closePerpPosition(
        positionId,
        currentPrice
      );
      if (response.success) {
        const pnl = response.position?.realizedPnL
          ? Number.parseFloat(response.position.realizedPnL)
          : 0;
        showNotification(
          `Position closed! PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
          pnl >= 0 ? 'success' : 'error'
        );
        if (response.newDemoBalance) {
          setDemoBalance(Number.parseFloat(response.newDemoBalance));
        }
        const updatedPositions = await telegramClient.getPerpPositions('OPEN');
        if (updatedPositions.success && updatedPositions.positions) {
          setPositions(updatedPositions.positions);
        }
      } else {
        showNotification(
          `Failed to close position: ${response.error}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error closing position:', error);
      showNotification('Error closing position', 'error');
    } finally {
      setIsTrading(false);
    }
  };

  const handlePairChange = (pair: string) => {
    setSelectedPair(pair);
    setShowPairSelector(false);
    const pairData = TRADING_PAIRS.find((p) => p.symbol === pair);
    if (pairData) {
      setChartData(generateChartData(pairData.initialPrice));
    }
  };

  const currentPairData = tradingPairs.find((p) => p.symbol === selectedPair);
  const currentPrice = currentPairData?.price || 0;
  const change24h = currentPairData?.change24h || 0;

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-[#0A0A0A] to-[#1A1A1A]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Image
            src="/images/image.png"
            alt="Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <h1 className="text-lg font-bold bg-linear-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent">
            Perp DEX
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-sm font-semibold text-white">
              ${demoBalance.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500/90 text-white'
              : notification.type === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-blue-500/90 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pair Selector & Price */}
        <div className="space-y-3">
          <button
            onClick={() => setShowPairSelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-[#D4AF37]/20 to-blue-500/20 border border-[#D4AF37]/50 rounded-xl hover:border-[#D4AF37] transition-all"
          >
            <span className="font-bold bg-linear-to-r from-[#D4AF37] to-blue-400 bg-clip-text text-transparent">
              {selectedPair}
            </span>
            <ChevronDown className="w-5 h-5 text-[#D4AF37]" />
          </button>

          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-white">
              ${currentPrice.toFixed(2)}
            </p>
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                change24h >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 ${
                  change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              />
              <span
                className={`text-sm font-semibold ${
                  change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {change24h >= 0 ? '+' : ''}
                {change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(['S', 'M', 'H', 'D', 'W'] as const).map((tf, idx) => (
            <button
              key={tf}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                idx === 0
                  ? 'bg-black text-white'
                  : 'bg-transparent text-gray-400 hover:bg-[#1A1A1A]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-64 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
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
                tick={{ fill: '#666', fontSize: 10 }}
                axisLine={{ stroke: '#2A2A2A' }}
                hide
              />
              <YAxis
                tick={{ fill: '#666', fontSize: 10 }}
                axisLine={{ stroke: '#2A2A2A' }}
                hide
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  padding: '8px',
                }}
                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Position Details Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-xs">
              <p className="text-gray-500">Size</p>
              <p className="font-bold text-white">${positionSize}</p>
            </div>
            <div className="text-xs">
              <p className="text-gray-500">Leverage</p>
              <p className="font-bold text-white">{leverage}x</p>
            </div>
          </div>
          <button
            onClick={() => setShowPositionDetails(true)}
            className="w-8 h-8 rounded-lg bg-[#0A0A0A] flex items-center justify-center hover:bg-[#252525] transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Open Positions */}
        {positions.length > 0 && (
          <div className="space-y-2">
            {positions.map((position) => {
              const pairPrice = tradingPairs.find(
                (p) => p.symbol === position.pair
              )?.price;
              const entryPrice = Number.parseFloat(position.entryPrice);
              const pnl = pairPrice
                ? (position.isLong
                    ? pairPrice - entryPrice
                    : entryPrice - pairPrice) *
                  Number.parseFloat(position.positionSize)
                : 0;
              return (
                <div
                  key={position.id}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {position.pair}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          position.isLong
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {position.isLong ? 'LONG' : 'SHORT'} {position.leverage}
                        x
                      </span>
                    </div>
                    <Button
                      onClick={() => handleClosePosition(position.id)}
                      disabled={isTrading}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1 rounded-full"
                    >
                      Close
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
                        ${pairPrice?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">PnL</p>
                      <p
                        className={`font-bold ${
                          pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="p-4 border-t border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="flex gap-3">
          <Button
            onClick={() => handleOpenPosition(true)}
            disabled={isTrading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-6 font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowUpRight className="w-6 h-6" />
            LONG
          </Button>
          <Button
            onClick={() => handleOpenPosition(false)}
            disabled={isTrading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-6 font-bold text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowDownLeft className="w-6 h-6" />
            SHORT
          </Button>
        </div>
      </div>

      {/* Pair Selector Bottom Sheet */}
      {showPairSelector && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowPairSelector(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">
                PICK TRADING PAIR
              </h2>
              <button
                onClick={() => setShowPairSelector(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
              {tradingPairs.map((pair) => (
                <button
                  key={pair.symbol}
                  onClick={() => handlePairChange(pair.symbol)}
                  className={`w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 transition-colors ${
                    selectedPair === pair.symbol
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-yellow-400 flex items-center justify-center font-bold text-white">
                      {pair.symbol.split('/')[0].charAt(0)}
                    </div>
                    <span className="font-bold text-black">{pair.symbol}</span>
                  </div>
                  <span className="text-2xl font-bold text-black">
                    {pair.price.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Position Details Bottom Sheet */}
      {showPositionDetails && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowPositionDetails(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">POSITION DETAILS</h2>
              <button
                onClick={() => setShowPositionDetails(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-3">
                  Position size:
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Pick the size for your position
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {POSITION_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setPositionSize(size)}
                      className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                        positionSize === size
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ${size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-3">
                  Leverage:
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Pick the leverage for your position
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {LEVERAGE_OPTIONS.map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                        leverage === lev
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  onClick={() => setShowPositionDetails(false)}
                  className="py-4 bg-white border-2 border-black text-black font-bold rounded-xl hover:bg-gray-50"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={() => setShowPositionDetails(false)}
                  className="py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900"
                >
                  SAVE
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
