/**
 * @macro delete-next-lines
 */
import { $parse$ } from "./macros/parse";

function $pre$() {
  return `import { Abi } from "@hazae41/cubane"`
}

$pre$()

export namespace PeanutAbi {
  export const makeDeposit = $parse$("makeDeposit(address,uint8,uint256,uint256,address)")
}
