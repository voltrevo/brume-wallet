import { $parse$ } from "./macros/parse";

function $pre$() {
  return `import { Cubane } from "@hazae41/cubane"`
}

$pre$()

export namespace PairAbi {
  export const getReserves = $parse$("getReserves()")
}
