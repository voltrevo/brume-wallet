export type EthereumChains<T = EthereumChain> =
  Record<number, T>

export interface EthereumChain {
  readonly name: string
  readonly chainId: number,
  readonly urls: readonly string[],
  readonly etherscan: string
  readonly token: NativeTokenInfo
}

export const chainByChainId: EthereumChains = {
  1: {
    name: "Ethereum",
    chainId: 1,
    urls: ["wss://eth.llamarpc.com"],
    etherscan: "https://etherscan.io",
    token: {
      name: "ETH",
      chainId: 1,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    }
  },
  5: {
    name: "Goerli",
    chainId: 5,
    urls: ["wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8"],
    etherscan: "https://goerli.etherscan.io",
    token: {
      name: "ETH",
      chainId: 5,
      symbol: "ETH",
      decimals: 18
    }
  },
  10: {
    name: "Optimism",
    chainId: 10,
    urls: ["https://endpoints.omniatech.io/v1/op/mainnet/public"],
    etherscan: "https://optimistic.etherscan.io",
    token: {
      name: "ETH",
      chainId: 10,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    }
  },
  56: {
    name: "Binance",
    chainId: 56,
    urls: ["https://endpoints.omniatech.io/v1/bsc/mainnet/public"],
    etherscan: "https://bnbscan.com",
    token: {
      name: "BNB",
      chainId: 56,
      symbol: "BNB",
      decimals: 18,
      pairs: ["0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae"]
    }
  },
  137: {
    name: "Polygon",
    chainId: 137,
    urls: ["wss://polygon.llamarpc.com"],
    etherscan: "https://polygonscan.com",
    token: {
      name: "MATIC",
      chainId: 137,
      symbol: "MATIC",
      decimals: 18,
      pairs: ["0x819f3450dA6f110BA6Ea52195B3beaFa246062dE", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    }
  },
  42161: {
    name: "Arbitrum",
    chainId: 42161,
    urls: ["https://endpoints.omniatech.io/v1/arbitrum/one/public"],
    etherscan: "https://arbiscan.io",
    token: {
      name: "ETH",
      chainId: 42161,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    }
  },
  43114: {
    name: "Avalanche",
    chainId: 43114,
    urls: ["https://endpoints.omniatech.io/v1/avax/mainnet/public"],
    etherscan: "https://snowtrace.io",
    token: {
      name: "ETH",
      chainId: 43114,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    }
  },
  11155111: {
    name: "Sepolia",
    chainId: 11155111,
    urls: ["wss://sepolia.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8"],
    etherscan: "https://sepolia.etherscan.io",
    token: {
      name: "ETH",
      chainId: 11155111,
      symbol: "ETH",
      decimals: 18
    }
  }
} as const

export const chainIdByName = {
  ETHEREUM: 1,
  GOERLI: 5,
  OPTIMISM: 10,
  BINANCE: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  AVALANCHE: 43114,
  SEPOLIA: 11155111
} as const

export type TokenInfo =
  | NativeTokenInfo
  | ContractTokenInfo

export interface NativeTokenInfo {
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly pairs?: readonly string[]
}

export interface ContractTokenInfo {
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly address: string
  readonly pairs?: readonly string[]
}

export const tokenByAddress: Record<string, ContractTokenInfo> = {
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
    name: "Wrapped ETH",
    chainId: 1,
    symbol: "WETH",
    decimals: 18,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": {
    name: "Wrapped BTC",
    chainId: 1,
    symbol: "WBTC",
    decimals: 8,
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    pairs: ["0xbb2b8038a1640196fbe3e38816f3e67cba72d940", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": {
    name: "DAI",
    chainId: 1,
    symbol: "DAI",
    decimals: 18,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    pairs: []
  },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
    name: "Tether USD",
    chainId: 1,
    symbol: "USDT",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    pairs: []
  },
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
    name: "USD Coin",
    chainId: 1,
    symbol: "USDC",
    decimals: 6,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    pairs: []
  },
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": {
    name: "MATIC",
    chainId: 1,
    symbol: "MATIC",
    decimals: 18,
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    pairs: ["0x819f3450dA6f110BA6Ea52195B3beaFa246062dE", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"],
  },
  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84": {
    name: "stETH",
    chainId: 1,
    symbol: "stETH",
    decimals: 18,
    address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x55d398326f99059fF775485246999027B3197955": {
    name: "Tether USD",
    chainId: 56,
    symbol: "BUSDT",
    decimals: 18,
    address: "0x55d398326f99059fF775485246999027B3197955",
    pairs: [],
  },
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c": {
    name: "Wrapped BNB",
    chainId: 56,
    symbol: "WBNB",
    decimals: 18,
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    pairs: ["0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae"],
  },
  "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58": {
    name: "Tether USD",
    chainId: 10,
    symbol: "USDT",
    decimals: 6,
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    pairs: []
  },
  "0x7F5c764cBc14f9669B88837ca1490cCa17c31607": {
    name: "USD Coin",
    chainId: 10,
    symbol: "USDC",
    decimals: 6,
    address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    pairs: []
  },
  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": {
    name: "DAI",
    chainId: 10,
    symbol: "DAI",
    decimals: 18,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    pairs: []
  },
  "0x68f180fcCe6836688e9084f035309E29Bf0A2095": {
    name: "Wrapped BTC",
    chainId: 10,
    symbol: "WBTC",
    decimals: 8,
    address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    pairs: ["0xbb2b8038a1640196fbe3e38816f3e67cba72d940", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  }
} as const

export const tokenById = {
  WETH_ON_ETHEREUM: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  WBTC_ON_ETHEREUM: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  DAI_ON_ETHEREUM: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDT_ON_ETHEREUM: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC_ON_ETHEREUM: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  MATIC_ON_ETHEREUM: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  STETH_ON_ETHEREUM: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",

  WBNB_ON_BINANCE: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  BUSDT_ON_BINANCE: "0x55d398326f99059fF775485246999027B3197955",

  USDT_ON_OPTIMISM: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  USDC_ON_OPTIMISM: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  DAI_ON_OPTIMISM: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  WBTC_ON_OPTIMISM: "0x68f180fcCe6836688e9084f035309E29Bf0A2095"
} as const

export interface PairInfo {
  readonly chainId: number,
  readonly name: string
  readonly address: string,
  readonly token0: string,
  readonly token1: string,
  readonly reversed?: boolean
}

export const pairByAddress: Record<string, PairInfo> = {
  "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852": {
    chainId: 1,
    name: "WETH_USDT",
    address: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852",
    token0: tokenById.WETH_ON_ETHEREUM,
    token1: tokenById.USDT_ON_ETHEREUM,
  },
  "0xbb2b8038a1640196fbe3e38816f3e67cba72d940": {
    chainId: 1,
    name: "WBTC_WETH",
    address: "0xbb2b8038a1640196fbe3e38816f3e67cba72d940",
    token0: tokenById.WBTC_ON_ETHEREUM,
    token1: tokenById.WETH_ON_ETHEREUM
  },
  "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE": {
    chainId: 1,
    name: "MATIC_WETH",
    address: "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE",
    token0: tokenById.MATIC_ON_ETHEREUM,
    token1: tokenById.WETH_ON_ETHEREUM,
  },
  "0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae": {
    chainId: 56,
    name: "BUSDT_WBNB",
    address: "0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae",
    token0: tokenById.BUSDT_ON_BINANCE,
    token1: tokenById.WBNB_ON_BINANCE,
    reversed: true
  }
} as const

export const pairByName = {
  WETH_USDT: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852",
  WBTC_WETH: "0xbb2b8038a1640196fbe3e38816f3e67cba72d940",
  MATIC_WETH: "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE",
  BUSDT_WBNB: "0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae",
} as const