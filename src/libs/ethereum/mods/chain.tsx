/* eslint-disable @next/next/no-img-element */
import { ContractTokenData, NativeTokenData } from "@/mods/background/service_worker/entities/tokens/data"

export type ChainId = number

export type Chains<T = ChainData> =
  Record<ChainId, T>

export interface ChainData {
  readonly name: string
  readonly chainId: ChainId,
  readonly urls: readonly string[],
  readonly etherscan: string
  readonly token: NativeTokenData
  readonly icon: () => JSX.Element
}

export const chainByChainId: Chains = {
  1: {
    name: "Ethereum",
    chainId: 1,
    urls: ["wss://ethereum.publicnode.com", "wss://mainnet.gateway.tenderly.co"],
    etherscan: "https://etherscan.io",
    token: {
      uuid: "664000af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 1,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <div className="h-6 w-6 bg-gray-900 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-white" style={{
          mask: `url(/assets/chains/ethereum.svg) no-repeat center / contain`,
          WebkitMask: `url(/assets/chains/ethereum.svg) no-repeat center / contain`
        }} />
      </div>
    },
  },
  5: {
    name: "Goerli (testnet)",
    chainId: 5,
    urls: ["wss://ethereum-goerli.publicnode.com"],
    etherscan: "https://goerli.etherscan.io",
    token: {
      uuid: "664001af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 5,
      symbol: "ETH",
      decimals: 18
    },
    icon() {
      return <div className={`h-6 w-6 bg-gray-900 rounded-full flex items-center justify-center text-xs`}>
        {`Gö`}
      </div>
    },
  },
  10: {
    name: "Optimism",
    chainId: 10,
    urls: ["wss://optimism.publicnode.com"],
    etherscan: "https://optimistic.etherscan.io",
    token: {
      uuid: "664002af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 10,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <img className="w-6 h-6"
        src="/assets/chains/optimism.svg"
        alt="Optimism" />
    },
  },
  56: {
    name: "Binance",
    chainId: 56,
    urls: ["wss://bsc.publicnode.com"],
    etherscan: "https://bnbscan.com",
    token: {
      uuid: "664003af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "BNB",
      chainId: 56,
      symbol: "BNB",
      decimals: 18,
      pairs: ["0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae"]
    },
    icon() {
      return <img className="w-6 h-6"
        src="/assets/chains/binance.svg"
        alt="Binance" />
    },
  },
  61: {
    name: "Ethereum Classic",
    chainId: 61,
    urls: ["https://etc.rivet.link"],
    etherscan: "https://blockscout.com/etc/mainnet/",
    token: {
      uuid: "664004af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETC",
      chainId: 61,
      symbol: "ETC",
      decimals: 18,
      pairs: ["0xdb8721b7a04c3e592264bf58558526b16b15e757"]
    },
    icon() {
      return <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-white" style={{
          mask: `url(/assets/chains/classic.svg) no-repeat center / contain`,
          WebkitMask: `url(/assets/chains/classic.svg) no-repeat center / contain`
        }} />
      </div>
    },
  },
  100: {
    name: "Gnosis",
    chainId: 100,
    urls: ["wss://gnosis.publicnode.com"],
    etherscan: "https://gnosisscan.io",
    token: {
      uuid: "664005af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "xDAI",
      chainId: 100,
      symbol: "xDAI",
      decimals: 18,
      pairs: []
    },
    icon() {
      return <div className="h-6 w-6 bg-emerald-600 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-white" style={{
          mask: `url(/assets/chains/gnosis.svg) no-repeat center / contain`,
          WebkitMask: `url(/assets/chains/gnosis.svg) no-repeat center / contain`
        }} />
      </div>
    },
  },
  137: {
    name: "Polygon Bor",
    chainId: 137,
    urls: ["wss://polygon-bor.publicnode.com"],
    etherscan: "https://polygonscan.com",
    token: {
      uuid: "664006af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "MATIC",
      chainId: 137,
      symbol: "MATIC",
      decimals: 18,
      pairs: ["0x819f3450dA6f110BA6Ea52195B3beaFa246062dE", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <div className="h-6 w-6 bg-purple-500 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-white" style={{
          mask: `url(/assets/chains/polygon.svg) no-repeat center / contain`,
          WebkitMask: `url(/assets/chains/polygon.svg) no-repeat center / contain`
        }} />
      </div>
    },
  },
  324: {
    name: "zkSync",
    chainId: 324,
    urls: ["https://1rpc.io/zksync2-era"],
    etherscan: "https://explorer.zksync.io/",
    token: {
      uuid: "664007af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 324,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <div className="h-6 w-6 bg-violet-500 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-white" style={{
          mask: `url(/assets/chains/zksync.png) no-repeat center / contain`,
          WebkitMask: `url(/assets/chains/zksync.png) no-repeat center / contain`
        }} />
      </div>
    },
  },
  7700: {
    name: "Canto",
    chainId: 7700,
    urls: ["https://canto.gravitychain.io"],
    etherscan: "https://cantoscan.com/",
    token: {
      uuid: "c0098941-1a08-4db1-9498-03a4cbceb672",
      type: "native",
      name: "Canto",
      chainId: 7700,
      symbol: "CANTO",
      decimals: 18
    },
    icon() {
      return <div className="h-6 w-6 bg-[#111111] rounded-full flex items-center justify-center">
        <img className="w-4 h-4"
          src="/assets/chains/canto.png"
          alt="Canto" />
      </div>
    },
  },
  8453: {
    name: "Base",
    chainId: 8453,
    urls: ["wss://base.publicnode.com"],
    etherscan: "https://basescan.org",
    token: {
      uuid: "664008af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 8453,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-white" style={{
          mask: `url(/assets/chains/base.svg) no-repeat center / contain`,
          WebkitMask: `url(/assets/chains/base.svg) no-repeat center / contain`
        }} />
      </div>
    },
  },
  42161: {
    name: "Arbitrum One",
    chainId: 42161,
    urls: ["wss://arbitrum-one.publicnode.com"],
    etherscan: "https://arbiscan.io",
    token: {
      uuid: "664009af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 42161,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-white" style={{
          mask: `url(/assets/chains/arbitrum.png) no-repeat center / contain`,
          WebkitMask: `url(/assets/chains/arbitrum.png) no-repeat center / contain`
        }} />
      </div>
    },
  },
  42220: {
    name: "Celo",
    chainId: 42220,
    urls: ["https://1rpc.io/celo"],
    etherscan: "https://celoscan.io",
    token: {
      uuid: "664010af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "CELO",
      chainId: 42220,
      symbol: "CELO",
      decimals: 18,
      pairs: ["0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422"]
    },
    icon() {
      return <img className="w-6 h-6"
        src="/assets/chains/celo.svg"
        alt="Celo" />
    },
  },
  43114: {
    name: "Avalanche C-Chain",
    chainId: 43114,
    urls: ["wss://avalanche-c-chain.publicnode.com"],
    etherscan: "https://snowtrace.io",
    token: {
      uuid: "664011af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 43114,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <img className="w-6 h-6"
        src="/assets/chains/avalanche.png"
        alt="Avalanche" />
    },
  },
  59144: {
    name: "Linea",
    chainId: 59144,
    urls: ["https://rpc.linea.build"],
    etherscan: "https://lineascan.build",
    token: {
      uuid: "664012af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 59144,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <img className="w-6 h-6 rounded-full"
        src="/assets/chains/linea.jpg"
        alt="Linea" />
    },
  },
  11155111: {
    name: "Sepolia (testnet)",
    chainId: 11155111,
    urls: ["wss://ethereum-sepolia.publicnode.com"],
    etherscan: "https://sepolia.etherscan.io",
    token: {
      uuid: "664013af-5c47-4b6e-ab3e-c0c130e23b3c",
      type: "native",
      name: "ETH",
      chainId: 11155111,
      symbol: "ETH",
      decimals: 18
    },
    icon() {
      return <div className={`h-6 w-6 bg-gray-900 rounded-full flex items-center justify-center text-xs`}>
        {`Se`}
      </div>
    },
  }
} as const

export const tokenByAddress: Record<string, ContractTokenData> = {
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
    uuid: "7b8dab00-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped ETH",
    chainId: 1,
    symbol: "WETH",
    decimals: 18,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": {
    uuid: "7b8dab01-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped BTC",
    chainId: 1,
    symbol: "WBTC",
    decimals: 8,
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    pairs: ["0xbb2b8038a1640196fbe3e38816f3e67cba72d940", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": {
    uuid: "7b8dab02-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "DAI",
    chainId: 1,
    symbol: "DAI",
    decimals: 18,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    pairs: []
  },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
    uuid: "7b8dab03-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Tether USD",
    chainId: 1,
    symbol: "USDT",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    pairs: []
  },
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
    uuid: "7b8dab04-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "USD Coin",
    chainId: 1,
    symbol: "USDC",
    decimals: 6,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    pairs: []
  },
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": {
    uuid: "7b8dab05-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "MATIC",
    chainId: 1,
    symbol: "MATIC",
    decimals: 18,
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    pairs: ["0x819f3450dA6f110BA6Ea52195B3beaFa246062dE", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"],
  },
  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84": {
    uuid: "7b8dab06-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "stETH",
    chainId: 1,
    symbol: "stETH",
    decimals: 18,
    address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58": {
    uuid: "7b8dab07-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Tether USD",
    chainId: 10,
    symbol: "USDT",
    decimals: 6,
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    pairs: []
  },
  "0x7F5c764cBc14f9669B88837ca1490cCa17c31607": {
    uuid: "7b8dab08-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "USD Coin",
    chainId: 10,
    symbol: "USDC",
    decimals: 6,
    address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    pairs: []
  },
  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": {
    uuid: "7b8dab09-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "DAI",
    chainId: 10,
    symbol: "DAI",
    decimals: 18,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    pairs: []
  },
  "0x68f180fcCe6836688e9084f035309E29Bf0A2095": {
    uuid: "7b8dab10-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped BTC",
    chainId: 10,
    symbol: "WBTC",
    decimals: 8,
    address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    pairs: ["0xbb2b8038a1640196fbe3e38816f3e67cba72d940", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c": {
    uuid: "7b8dab11-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped BNB",
    chainId: 56,
    symbol: "WBNB",
    decimals: 18,
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    pairs: ["0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae"],
  },
  "0x55d398326f99059fF775485246999027B3197955": {
    uuid: "7b8dab12-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Tether USD",
    chainId: 56,
    symbol: "USDT",
    decimals: 18,
    address: "0x55d398326f99059fF775485246999027B3197955",
    pairs: [],
  },
  "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56": {
    uuid: "7b8dab13-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "BUSD",
    chainId: 56,
    symbol: "BUSD",
    decimals: 18,
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    pairs: []
  },
  "0x3d6545b08693dae087e957cb1180ee38b9e3c25e": {
    uuid: "7b8dab14-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "ETC",
    chainId: 56,
    symbol: "ETC",
    decimals: 18,
    address: "0x3d6545b08693dae087e957cb1180ee38b9e3c25e",
    pairs: ["0xdb8721b7a04c3e592264bf58558526b16b15e757"]
  },
  "0xc2132D05D31c914a87C6611C10748AEb04B58e8F": {
    uuid: "7b8dab15-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Tether USD",
    chainId: 137,
    symbol: "USDT",
    decimals: 6,
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    pairs: []
  },
  "0x471EcE3750Da237f93B8E339c536989b8978a438": {
    uuid: "7b8dab16-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped CELO",
    chainId: 42220,
    symbol: "WCELO",
    decimals: 18,
    address: "0x471EcE3750Da237f93B8E339c536989b8978a438",
    pairs: ["0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422"]
  },
  "0x64dEFa3544c695db8c535D289d843a189aa26b98": {
    uuid: "7b8dab17-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "mCUSD",
    chainId: 42220,
    symbol: "mCUSD",
    decimals: 18,
    address: "0x64dEFa3544c695db8c535D289d843a189aa26b98",
    pairs: []
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
  USDT_ON_BINANCE: "0x55d398326f99059fF775485246999027B3197955",
  BUSD_ON_BINANCE: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  ETC_ON_BINANCE: "0x3d6545b08693dae087e957cb1180ee38b9e3c25e",

  USDT_ON_OPTIMISM: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  USDC_ON_OPTIMISM: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  DAI_ON_OPTIMISM: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  WBTC_ON_OPTIMISM: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",

  USDT_ON_POLYGON: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",

  CELO_ON_CELO: "0x471EcE3750Da237f93B8E339c536989b8978a438",
  MSUSD_ON_CELO: "0x64dEFa3544c695db8c535D289d843a189aa26b98"
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
    name: "USDT_WBNB",
    address: "0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae",
    token0: tokenById.USDT_ON_BINANCE,
    token1: tokenById.WBNB_ON_BINANCE,
    reversed: true
  },
  "0xdb8721b7a04c3e592264bf58558526b16b15e757": {
    chainId: 56,
    name: "ETC_BUSD",
    address: "0xdb8721b7a04c3e592264bf58558526b16b15e757",
    token0: "0x3d6545b08693dae087e957cb1180ee38b9e3c25e",
    token1: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
  },
  "0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422": {
    chainId: 42220,
    name: "CELO_MCUSD",
    address: "0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422",
    token0: "0x471EcE3750Da237f93B8E339c536989b8978a438",
    token1: "0x64dEFa3544c695db8c535D289d843a189aa26b98"
  }
} as const

export const pairByName = {
  WETH_USDT: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852",
  WBTC_WETH: "0xbb2b8038a1640196fbe3e38816f3e67cba72d940",
  MATIC_WETH: "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE",
  USDT_WBNB: "0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae",
  ETC_BUSD: "0xdb8721b7a04c3e592264bf58558526b16b15e757",
  CELO_MCUSD: "0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422"
} as const