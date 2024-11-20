import { Fixed } from "@hazae41/cubane"
import { StoredPairData } from "../ethereum/mods/chain"

export namespace UniswapV2 {


  export function computeOrThrow(pair: StoredPairData, reserves: [bigint, bigint]) {
    const [reserve0, reserve1] = reserves

    const quantity0 = new Fixed(reserve0, pair.token0.decimals)
    const quantity1 = new Fixed(reserve1, pair.token1.decimals)

    if (pair.reversed)
      return quantity0.div(quantity1)

    return quantity1.div(quantity0)
  }

}

export namespace UniswapV3 {

  export interface SimpleUniswapV3TokenData {
    readonly address: string,
    readonly decimals: number
  }

  export interface SimpleUniswapV3PoolData {
    readonly address: string,
    readonly token0: SimpleUniswapV3TokenData,
    readonly token1: SimpleUniswapV3TokenData,
    readonly reversed?: boolean
  }

  export function computeOrThrow(pool: SimpleUniswapV3PoolData, sqrtPriceX96: bigint) {
    const priceX96BigInt = sqrtPriceX96 ** 2n

    const a = new Fixed(priceX96BigInt, pool.token1.decimals)
    const b = new Fixed(((2n ** 96n) ** 2n), pool.token0.decimals)

    if (pool.reversed)
      return a.div(b)

    return b.div(a)
  }

}