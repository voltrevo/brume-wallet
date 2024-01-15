/**
 * @macro delete-next-lines
 */
import { $parse$ } from "./macros/parse";

function $pre$() {
  return `import { Abi } from "@hazae41/cubane"`
}

$pre$()

export namespace TokenAbi {
  export const balanceOf = $parse$("balanceOf(address)")
  export const transfer = $parse$("transfer(address,uint256)")
  export const approve = $parse$("approve(address,uint256)")
}
