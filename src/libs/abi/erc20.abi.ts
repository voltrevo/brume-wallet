import { $parse$ } from "./macros/parse";

import { Cubane } from "@hazae41/cubane"

export namespace TokenAbi {
  export const balanceOf = Cubane.Abi.createFunctionSignature("balanceOf",Cubane.Abi.createFunctionSelectorAndArguments(Cubane.Abi.FunctionSelector.from([112,160,130,49]),Cubane.Abi.createDynamicTuple(Cubane.Abi.StaticAddress)))
}
