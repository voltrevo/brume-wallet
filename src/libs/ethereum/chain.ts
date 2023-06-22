export type EthereumChains<T = EthereumChain> =
  Record<number, T>

export interface EthereumChain {
  chainId: number,
  url: string,
  etherscan: string
}

export const chains: EthereumChains = {
  1: {
    chainId: 1,
    url: "wss://eth.llamarpc.com",
    etherscan: "https://etherscan.io"
  },
  5: {
    chainId: 5,
    url: "wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8",
    etherscan: "https://goerli.etherscan.io"
  },
  137: {
    chainId: 137,
    url: "wss://polygon.llamarpc.com",
    etherscan: "https://polygonscan.com"
  }
}

export interface TokenInfo<D extends number = number> {
  chainId: number,
  symbol: string,
  decimals: number,
  address: string
}

export const tokensByAddress: Record<string, TokenInfo> = {
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
    chainId: 1,
    symbol: "WETH",
    decimals: 18,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
    chainId: 1,
    symbol: "USDC",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  },
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": {
    chainId: 1,
    symbol: "MATIC",
    decimals: 18,
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0"
  }
} as const

export interface PairInfo {
  chainId: number,
  name: string
  address: string,
  token0: string,
  token1: string,
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
}

export const pairsByName = {
  WETH_USDT: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852",
  MATIC_WETH: "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE"
}