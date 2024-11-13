/**
 * @macro delete-next-lines
 */
import { $parse$ } from "./macros/parse";

function $pre$() {
  return `import { Abi } from "@hazae41/cubane"`
}

$pre$()

export namespace PairAbiV2 {
  export const getReserves = $parse$("getReserves()")
}

export namespace PairAbiV3 {
  export const slot0 = $parse$("slot0()")
}