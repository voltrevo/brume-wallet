/**
 * @macro delete-next-lines
 */
import { $parse$ } from "./macros/parse";

function $pre$() {
  return `import { Abi } from "@hazae41/cubane"`
}

$pre$()

export namespace RankingAbi {
  export const addressOf = $parse$("addressOf(uint256)")
}

export namespace RegistryAbi {
  export const registry = $parse$("registry(address)")
}