import { Fixed } from "@hazae41/cubane"
import { PairData, tokenByAddress } from "../ethereum/mods/chain"

export namespace UniswapV2 {

  export function computeOrThrow(pair: PairData, reserves: [bigint, bigint]) {
    const decimals0 = tokenByAddress[pair.token0].decimals
    const decimals1 = tokenByAddress[pair.token1].decimals

    const [reserve0, reserve1] = reserves

    const quantity0 = new Fixed(reserve0, decimals0)
    const quantity1 = new Fixed(reserve1, decimals1)

    if (pair.reversed)
      return quantity0.div(quantity1)

    return quantity1.div(quantity0)
  }

}

export namespace UniswapV3 {

  export function computeOrThrow(pair: PairData, sqrtPriceX96: Fixed.From<0>) {
    const decimals0 = tokenByAddress[pair.token0].decimals
    const decimals1 = tokenByAddress[pair.token1].decimals

    const sqrtPriceX96BigInt = Fixed.from(sqrtPriceX96).value

    const priceBigInt = (sqrtPriceX96BigInt / (2n ** 96n)) ** 2n
    const ratioBigInt = (10n ** BigInt(decimals1)) / (10n ** BigInt(decimals0))

    return new Fixed(priceBigInt / ratioBigInt, decimals1)
  }

}