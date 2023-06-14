export type EthereumChains<T = EthereumChain> =
  Record<number, T>

export interface EthereumChain {
  id: number,
  url: string,
  etherscan: string
}

export const chains: EthereumChains = {
  1: {
    id: 1,
    url: "wss://eth.llamarpc.com",
    etherscan: "https://etherscan.io"
  },
  5: {
    id: 5,
    url: "wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8",
    etherscan: "https://goerli.etherscan.io"
  },
  137: {
    id: 137,
    url: "wss://polygon.llamarpc.com",
    etherscan: "https://polygonscan.com"
  }
}