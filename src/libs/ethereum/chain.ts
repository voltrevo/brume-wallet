export type EthereumChains<T = EthereumChain> =
  Record<number, T>

export interface EthereumChain {
  chainId: number,
  url: string,
  etherscan: string
  token: TokenInfo
}

export const chains: EthereumChains = {
  1: {
    chainId: 1,
    url: "wss://eth.llamarpc.com",
    etherscan: "https://etherscan.io",
    token: {
      chainId: 1,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    }
  },
  5: {
    chainId: 5,
    url: "wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8",
    etherscan: "https://goerli.etherscan.io",
    token: {
      chainId: 5,
      symbol: "ETH",
      decimals: 18
    }
  },
  137: {
    chainId: 137,
    url: "wss://polygon.llamarpc.com",
    etherscan: "https://polygonscan.com",
    token: {
      chainId: 137,
      symbol: "MATIC",
      decimals: 18,
      pairs: ["0x819f3450dA6f110BA6Ea52195B3beaFa246062dE", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    }
  }
}

export type TokenInfo =
  | NativeTokenInfo
  | ContractTokenInfo

export interface NativeTokenInfo {
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly pairs?: readonly string[]
}

export interface ContractTokenInfo {
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly address?: string
  readonly pairs?: readonly string[]
}

export const tokensByAddress: Record<string, ContractTokenInfo> = {
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
    chainId: 1,
    symbol: "WETH",
    decimals: 18,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
    chainId: 1,
    symbol: "USDC",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    pairs: []
  },
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": {
    chainId: 1,
    symbol: "MATIC",
    decimals: 18,
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    pairs: ["0x819f3450dA6f110BA6Ea52195B3beaFa246062dE", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"],
  }
} as const

export interface PairInfo {
  readonly chainId: number,
  readonly name: string
  readonly address: string,
  readonly token0: string,
  readonly token1: string,
}

export const pairsByAddress: Record<string, PairInfo> = {
  "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852": {
    chainId: 1,
    name: "WETH_USDT",
    address: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852",
    token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE": {
    chainId: 1,
    name: "MATIC_WETH",
    address: "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE",
    token0: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  }
} as const

export const pairsByName = {
  WETH_USDT: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852",
  MATIC_WETH: "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE"
} as const