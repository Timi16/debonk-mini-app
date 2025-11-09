import { Chain, Position, PositionWithPrice } from "./types";

export const dummyChains: Chain[] = [
  {
    key: "ethereum",
    name: "Ethereum Mainnet",
    chainId: 1,
    nativeToken: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
    explorerUrl: "https://etherscan.io",
  },
  {
    key: "polygon",
    name: "Polygon Mainnet",
    chainId: 137,
    nativeToken: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
  },
  {
    key: "bnb",
    name: "BNB Smart Chain",
    chainId: 56,
    nativeToken: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
  },
  {
    key: "arbitrum",
    name: "Arbitrum One",
    chainId: 42161,
    nativeToken: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
  },
  {
    key: "solana",
    name: "Solana Mainnet",
    chainId: "mainnet-beta",
    nativeToken: {
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
    },
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
  },
  {
    key: "sepolia",
    name: "Ethereum Sepolia Testnet",
    chainId: 11155111,
    nativeToken: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
    explorerUrl: "https://sepolia.etherscan.io",
  },
];

export const dummyPositions: Position[] = [
  {
    id: "pos_001",
    tokenAddress: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2", // WETH
    tokenTicker: "ETH",
    amountHeld: "2.5",
    avgBuyPrice: "3200.00",
    chain: "ethereum",
    walletId: "wallet_0x123abc",
    profitLoss: "450.00",
    profitLossPercent: "18.00",
    isSimulation: false,
    competitionId: null,
    teamId: null,
    createdAt: "2025-10-15T10:24:00Z",
    updatedAt: "2025-11-08T09:10:00Z",
  },
  {
    id: "pos_002",
    tokenAddress: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
    tokenTicker: "MATIC",
    amountHeld: "1500",
    avgBuyPrice: "0.85",
    chain: "polygon",
    walletId: "wallet_0x123abc",
    isSimulation: false,
    competitionId: "comp_2025_alpha",
    profitLoss: "300.00",
    profitLossPercent: "25.00",
    teamId: 12,
    createdAt: "2025-09-20T14:12:00Z",
    updatedAt: "2025-11-08T08:45:00Z",
  },
  {
    id: "pos_003",
    tokenAddress: "So11111111111111111111111111111111111111112", // SOL
    tokenTicker: "SOL",
    amountHeld: "10.8",
    avgBuyPrice: "145.50",
    chain: "solana",
    walletId: "wallet_sol_098xyz",
    isSimulation: true,
    profitLoss: "75.60",
    profitLossPercent: "6.12",
    competitionId: "comp_2025_test",
    teamId: 4,
    createdAt: "2025-10-25T07:00:00Z",
    updatedAt: "2025-11-07T22:00:00Z",
  },
];

export const positionsWithPrice: PositionWithPrice[] = [
  {
    ...dummyPositions[0],
    currentPrice: 3380.45,
    marketCap: "406,520,000,000",
    priceChange24h: 2.35,
  },
  {
    ...dummyPositions[1],
    currentPrice: 0.91,
    marketCap: "8,120,000,000",
    priceChange24h: 1.12,
  },
  {
    ...dummyPositions[2],
    currentPrice: 152.25,
    marketCap: "67,330,000,000",
    priceChange24h: -0.75,
  },
];
