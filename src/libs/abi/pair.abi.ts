import { $parse$ } from "./macros/parse";

import { Cubane } from "@hazae41/cubane"

export namespace PairAbi {
  export const getReserves = Cubane.Abi.createFunctionSignature("getReserves",Cubane.Abi.createFunctionSelectorAndArguments(Cubane.Abi.FunctionSelector.from([9,2,241,172]),Cubane.Abi.createDynamicTuple()))
}
