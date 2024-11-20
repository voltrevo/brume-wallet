/* eslint-disable @next/next/no-img-element */
import { ContractTokenData as StoredContractTokenData, NativeTokenData as StoredNativeTokenData } from "@/mods/background/service_worker/entities/tokens/data"
import { ZeroHexString } from "@hazae41/cubane"

export type ChainId = number

export interface ChainData {
  readonly name: string
  readonly chainId: ChainId,
  readonly urls: readonly string[],
  readonly etherscan: string
  readonly token: StoredNativeTokenData
  readonly icon: () => JSX.Element
}

export const chainDataByChainId: Record<ChainId, ChainData> = {
  1: {
    name: "Ethereum",
    chainId: 1,
    urls: ["wss://ethereum-rpc.publicnode.com", "https://1rpc.io/eth"],
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
  10: {
    name: "Optimism",
    chainId: 10,
    urls: ["wss://optimism-rpc.publicnode.com", "https://1rpc.io/op"],
    etherscan: "https://optimistic.etherscan.io",
    token: {
      uuid: "d82dbb70-ba5a-4d08-a145-af13480192bf",
      type: "native",
      name: "ETH",
      chainId: 10,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <img className="w-6 h-6 rounded-full"
        src="/assets/chains/optimism.svg"
        alt="Optimism" />
    },
  },
  56: {
    name: "BNB Smart Chain",
    chainId: 56,
    urls: ["wss://bsc-rpc.publicnode.com", "https://1rpc.io/bnb"],
    etherscan: "https://bscscan.com",
    token: {
      uuid: "400f67d6-953b-4844-ad73-f677859b273d",
      type: "native",
      name: "BNB",
      chainId: 56,
      symbol: "BNB",
      decimals: 18,
      pairs: ["0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae"]
    },
    icon() {
      return <img className="w-6 h-6 rounded-full"
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
      uuid: "d2c359e7-c3b7-473e-acc9-a52e5f32ed03",
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
    urls: ["wss://gnosis-rpc.publicnode.com", "https://1rpc.io/gnosis"],
    etherscan: "https://gnosisscan.io",
    token: {
      uuid: "84cd6486-941f-4cf8-8e72-dc441ab9802d",
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
    name: "Polygon",
    chainId: 137,
    urls: ["wss://polygon-bor-rpc.publicnode.com", "https://1rpc.io/matic"],
    etherscan: "https://polygonscan.com",
    token: {
      uuid: "21e58495-ad1c-494d-898d-33ba3ff4b013",
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
  204: {
    name: "opBNB",
    chainId: 204,
    urls: ["wss://opbnb-rpc.publicnode.com", "https://1rpc.io/opbnb"],
    etherscan: "https://opbnbscan.com/",
    token: {
      uuid: "5c94437e-3f5c-4d95-a849-328a416f1b78",
      type: "native",
      name: "BNB",
      chainId: 204,
      symbol: "BNB",
      decimals: 18,
      pairs: ["0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae"]
    },
    icon() {
      return <img className="w-6 h-6 rounded-full"
        src="/assets/chains/binance.svg"
        alt="Binance" />
    },
  },
  324: {
    name: "zkSync",
    chainId: 324,
    urls: ["https://1rpc.io/zksync2-era"],
    etherscan: "https://explorer.zksync.io/",
    token: {
      uuid: "943d8709-3b37-4788-8512-44eb747e6fd0",
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
  1116: {
    name: "Core",
    chainId: 1116,
    urls: ["https://1rpc.io/core"],
    etherscan: "https://scan.coredao.org",
    token: {
      uuid: "c7adde9b-55cd-4677-b5bd-97a22ee77c1e",
      type: "native",
      name: "CORE",
      chainId: 1116,
      symbol: "CORE",
      decimals: 18,
    },
    icon() {
      return <img className="w-6 h-6 rounded-full"
        src="/assets/chains/core.png"
        alt="Core" />
    },
  },
  5000: {
    name: "Mantle",
    chainId: 5000,
    urls: ["wss://mantle-rpc.publicnode.com", "https://1rpc.io/mantle"],
    etherscan: "https://explorer.mantle.xyz",
    token: {
      uuid: "e55bb9b6-8ac8-47a1-ac7e-9736c3bbc078",
      type: "native",
      name: "Mantle",
      chainId: 5000,
      symbol: "MNT",
      decimals: 18
    },
    icon() {
      return <img className="w-6 h-6 rounded-full"
        src="/assets/chains/mantle.svg"
        alt="Mantle" />
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
    urls: ["wss://base-rpc.publicnode.com", "https://1rpc.io/base"],
    etherscan: "https://basescan.org",
    token: {
      uuid: "2111ff5a-6671-4ebe-9429-a974c8c85726",
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
    name: "Arbitrum",
    chainId: 42161,
    urls: ["wss://arbitrum-one-rpc.publicnode.com", "https://1rpc.io/arb"],
    etherscan: "https://arbiscan.io",
    token: {
      uuid: "6fce1dd8-d1f0-4a00-b152-cd1f5b73c820",
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
    urls: ["wss://celo-rpc.publicnode.com", "https://1rpc.io/celo"],
    etherscan: "https://celoscan.io",
    token: {
      uuid: "be652dfe-8748-4e84-8be2-0a449dd45aff",
      type: "native",
      name: "CELO",
      chainId: 42220,
      symbol: "CELO",
      decimals: 18,
      pairs: ["0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422"]
    },
    icon() {
      return <img className="w-6 h-6 rounded-full"
        src="/assets/chains/celo.svg"
        alt="Celo" />
    },
  },
  43114: {
    name: "Avalanche C",
    chainId: 43114,
    urls: ["wss://avalanche-c-chain-rpc.publicnode.com", "https://1rpc.io/avax/c"],
    etherscan: "https://snowtrace.io",
    token: {
      uuid: "22decc24-d6e3-4bbf-bfbb-c8819737f925",
      type: "native",
      name: "ETH",
      chainId: 43114,
      symbol: "ETH",
      decimals: 18,
      pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
    },
    icon() {
      return <img className="w-6 h-6 rounded-full"
        src="/assets/chains/avalanche.png"
        alt="Avalanche" />
    },
  },
  59144: {
    name: "Linea",
    chainId: 59144,
    urls: ["wss://linea-rpc.publicnode.com", "https://1rpc.io/linea"],
    etherscan: "https://lineascan.build",
    token: {
      uuid: "a006d905-527c-419e-90f6-88d42c606899",
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
    urls: ["wss://ethereum-sepolia-rpc.publicnode.com", "https://1rpc.io/sepolia"],
    etherscan: "https://sepolia.etherscan.io",
    token: {
      uuid: "65c497e4-0aa3-443f-a201-f2141199a6e5",
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

export const tokenByAddress: Record<string, StoredContractTokenData> = {
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
    uuid: "7b8dab00-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped ETH",
    chainId: 1,
    symbol: "WETH",
    decimals: 18,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as ZeroHexString,
    pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": {
    uuid: "7b8dab01-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped BTC",
    chainId: 1,
    symbol: "WBTC",
    decimals: 8,
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" as ZeroHexString,
    pairs: ["0xbb2b8038a1640196fbe3e38816f3e67cba72d940", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": {
    uuid: "7b8dab02-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "DAI",
    chainId: 1,
    symbol: "DAI",
    decimals: 18,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" as ZeroHexString,
    pairs: []
  },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
    uuid: "7b8dab03-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Tether USD",
    chainId: 1,
    symbol: "USDT",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as ZeroHexString,
    pairs: []
  },
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
    uuid: "7b8dab04-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "USD Coin",
    chainId: 1,
    symbol: "USDC",
    decimals: 6,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as ZeroHexString,
    pairs: []
  },
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": {
    uuid: "7b8dab05-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "MATIC",
    chainId: 1,
    symbol: "MATIC",
    decimals: 18,
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0" as ZeroHexString,
    pairs: ["0x819f3450dA6f110BA6Ea52195B3beaFa246062dE", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"],
  },
  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84": {
    uuid: "7b8dab06-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "stETH",
    chainId: 1,
    symbol: "stETH",
    decimals: 18,
    address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84" as ZeroHexString,
    pairs: ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58": {
    uuid: "7b8dab07-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Tether USD",
    chainId: 10,
    symbol: "USDT",
    decimals: 6,
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" as ZeroHexString,
    pairs: []
  },
  "0x7F5c764cBc14f9669B88837ca1490cCa17c31607": {
    uuid: "7b8dab08-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "USD Coin",
    chainId: 10,
    symbol: "USDC",
    decimals: 6,
    address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" as ZeroHexString,
    pairs: []
  },
  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": {
    uuid: "7b8dab09-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "DAI",
    chainId: 10,
    symbol: "DAI",
    decimals: 18,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" as ZeroHexString,
    pairs: []
  },
  "0x68f180fcCe6836688e9084f035309E29Bf0A2095": {
    uuid: "7b8dab10-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped BTC",
    chainId: 10,
    symbol: "WBTC",
    decimals: 8,
    address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095" as ZeroHexString,
    pairs: ["0xbb2b8038a1640196fbe3e38816f3e67cba72d940", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
  },
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c": {
    uuid: "7b8dab11-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped BNB",
    chainId: 56,
    symbol: "WBNB",
    decimals: 18,
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as ZeroHexString,
    pairs: ["0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae"],
  },
  "0x55d398326f99059fF775485246999027B3197955": {
    uuid: "7b8dab12-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Tether USD",
    chainId: 56,
    symbol: "USDT",
    decimals: 18,
    address: "0x55d398326f99059fF775485246999027B3197955" as ZeroHexString,
    pairs: [],
  },
  "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56": {
    uuid: "7b8dab13-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "BUSD",
    chainId: 56,
    symbol: "BUSD",
    decimals: 18,
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" as ZeroHexString,
    pairs: []
  },
  "0x3d6545b08693dae087e957cb1180ee38b9e3c25e": {
    uuid: "7b8dab14-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "ETC",
    chainId: 56,
    symbol: "ETC",
    decimals: 18,
    address: "0x3d6545b08693dae087e957cb1180ee38b9e3c25e" as ZeroHexString,
    pairs: ["0xdb8721b7a04c3e592264bf58558526b16b15e757"]
  },
  "0xc2132D05D31c914a87C6611C10748AEb04B58e8F": {
    uuid: "7b8dab15-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Tether USD",
    chainId: 137,
    symbol: "USDT",
    decimals: 6,
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as ZeroHexString,
    pairs: []
  },
  "0x471EcE3750Da237f93B8E339c536989b8978a438": {
    uuid: "7b8dab16-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Wrapped CELO",
    chainId: 42220,
    symbol: "WCELO",
    decimals: 18,
    address: "0x471EcE3750Da237f93B8E339c536989b8978a438" as ZeroHexString,
    pairs: ["0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422"]
  },
  "0x64dEFa3544c695db8c535D289d843a189aa26b98": {
    uuid: "7b8dab17-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "mCUSD",
    chainId: 42220,
    symbol: "mCUSD",
    decimals: 18,
    address: "0x64dEFa3544c695db8c535D289d843a189aa26b98" as ZeroHexString,
    pairs: []
  },
  "0xD0EbFe04Adb5Ef449Ec5874e450810501DC53ED5": {
    uuid: "7b8dab18-e96b-41aa-b9d8-0ba39d2f96a6",
    type: "contract",
    name: "Brume",
    chainId: 1,
    symbol: "BRUME",
    decimals: 18,
    address: "0xD0EbFe04Adb5Ef449Ec5874e450810501DC53ED5" as ZeroHexString,
    pairs: ["0xF938596B738E058F2c70E93F9a0436f1B20aC495", "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
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

export type StoredPairData =
  | StoredPairDataV2
  | StoredPairDataV3

export interface StoredPairDataV2 {
  readonly name: string
  readonly chainId: number,
  readonly address: string,
  readonly version: 2
  readonly token0: StoredContractTokenData,
  readonly token1: StoredContractTokenData,
  readonly reversed?: boolean
}

export interface StoredPairDataV3 {
  readonly name: string
  readonly chainId: number,
  readonly address: string,
  readonly version: 3
  readonly token0: StoredContractTokenData,
  readonly token1: StoredContractTokenData,
  readonly reversed?: boolean
}

export const pairByAddress: Record<string, StoredPairData> = {
  "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852": {
    chainId: 1,
    version: 2,
    name: "WETH_USDT",
    address: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852",
    token0: tokenByAddress[tokenById.WETH_ON_ETHEREUM],
    token1: tokenByAddress[tokenById.USDT_ON_ETHEREUM],
  },
  "0xbb2b8038a1640196fbe3e38816f3e67cba72d940": {
    chainId: 1,
    version: 2,
    name: "WBTC_WETH",
    address: "0xbb2b8038a1640196fbe3e38816f3e67cba72d940",
    token0: tokenByAddress[tokenById.WBTC_ON_ETHEREUM],
    token1: tokenByAddress[tokenById.WETH_ON_ETHEREUM]
  },
  "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE": {
    chainId: 1,
    version: 2,
    name: "MATIC_WETH",
    address: "0x819f3450dA6f110BA6Ea52195B3beaFa246062dE",
    token0: tokenByAddress[tokenById.MATIC_ON_ETHEREUM],
    token1: tokenByAddress[tokenById.WETH_ON_ETHEREUM],
  },
  "0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae": {
    chainId: 56,
    version: 2,
    name: "USDT_WBNB",
    address: "0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae",
    token0: tokenByAddress[tokenById.USDT_ON_BINANCE],
    token1: tokenByAddress[tokenById.WBNB_ON_BINANCE],
    reversed: true
  },
  "0xdb8721b7a04c3e592264bf58558526b16b15e757": {
    chainId: 56,
    version: 2,
    name: "ETC_BUSD",
    address: "0xdb8721b7a04c3e592264bf58558526b16b15e757",
    token0: tokenByAddress["0x3d6545b08693dae087e957cb1180ee38b9e3c25e"],
    token1: tokenByAddress["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]
  },
  "0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422": {
    chainId: 42220,
    version: 2,
    name: "CELO_MCUSD",
    address: "0xf5b1bc6c9c180b64f5711567b1d6a51a350f8422",
    token0: tokenByAddress["0x471EcE3750Da237f93B8E339c536989b8978a438"],
    token1: tokenByAddress["0x64dEFa3544c695db8c535D289d843a189aa26b98"]
  },
  "0xF938596B738E058F2c70E93F9a0436f1B20aC495": {
    chainId: 1,
    version: 3,
    name: "BRUME_WETH",
    address: "0xF938596B738E058F2c70E93F9a0436f1B20aC495",
    token0: tokenByAddress["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
    token1: tokenByAddress["0xD0EbFe04Adb5Ef449Ec5874e450810501DC53ED5"],
  }
} as const