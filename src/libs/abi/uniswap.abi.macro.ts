/**
 * @macro delete-next-lines
 */
import { $parse$ } from "./macros/parse";

function $pre$() {
  return `import { Abi } from "@hazae41/cubane"`
}

$pre$()

export namespace UniswapV3FactoryAbi {
  export const getPool = $parse$("getPool(address,address,uint24)")
}

export namespace UniswapV3PoolAbi {
  export const slot0 = $parse$("slot0()")

  export const token0 = $parse$("token0()")
  export const token1 = $parse$("token1()")
}

export namespace UniswapV2PoolAbi {
  export const getReserves = $parse$("getReserves()")
}