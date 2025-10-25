export interface Chain {
  key: string
  name: string
  chainId: string | number
  nativeToken: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrl: string
  explorerUrl: string
}

export interface Balance {
  success: boolean
  telegramId: string
  chain: string
  balance: number
  decimals: number
  raw: string
  type: "native" | "token"
  error?: string
}

export interface Position {
  id: string
  tokenAddress: string
  tokenTicker: string
  amountHeld: string
  avgBuyPrice: string
  chain: string
  walletId: string
  isSimulation: boolean
  competitionId: string | null
  teamId: number | null
  createdAt: string
  updatedAt: string
}

export interface PositionWithPrice extends Position {
  currentPrice?: number
  marketCap?: string
  priceChange24h?: number
}

export interface UserProfile {
  success: boolean
  user: {
    id: number
    telegramId: string
    referralProfit: number
    referralCountDirect: number
    referralCountIndirect: number
    simulationBalance: string
    activeCompetitionId: string | null
    createdAt: string
    updatedAt: string
  }
  stats: {
    positionsCount: number
    transactionsCount: number
  }
}

export interface WalletAddress {
  success: boolean
  telegramId: string
  chain: string
  address: string
  error?: string
}

export interface TokenDetails {
  success: boolean
  chain: string
  contractAddress: string
  token: {
    name: string
    symbol: string
    address: string
    priceUsd: number
    priceNative: number
    marketCap: number
    liquidityInUsd: number
    twitterUrl?: string
    websiteUrl?: string
    telegramUrl?: string
    volume?: {
      m5: number
      h1: number
      h24: number
      d7?: number
    }
    change?: {
      m5?: number
      h1: number
      h24: number
      d7?: number
    }
    source?: string
  }
}

export interface BuyResponse {
  success: boolean
  telegramId: string
  chain: string
  tokenAddress: string
  amountInNative: number
  transactionHash?: string
  message?: string
  error?: string
}

export interface SellResponse {
  success: boolean
  telegramId: string
  chain: string
  tokenAddress: string
  percentToSell: number
  transactionHash?: string
  amountSold?: number
  message?: string
  error?: string
}

export interface SelectedToken {
  name: string
  symbol: string
  address: string
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
  sellAmounts: string[]
}

export interface Notification {
  id: string
  message: string
  type: "success" | "error" | "info"
}
