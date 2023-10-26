import { $parse$ } from "./macros/parse";

import { Cubane } from "@hazae41/cubane"

export namespace EnsAbi {
  export const resolver = Cubane.Abi.createFunctionSignature("resolver",Cubane.Abi.createFunctionSelectorAndArguments(Cubane.Abi.FunctionSelector.from([1,120,184,191]),Cubane.Abi.createDynamicTuple(Cubane.Abi.Bytes32)))
  export const addr = Cubane.Abi.createFunctionSignature("addr",Cubane.Abi.createFunctionSelectorAndArguments(Cubane.Abi.FunctionSelector.from([59,59,87,222]),Cubane.Abi.createDynamicTuple(Cubane.Abi.Bytes32)))
  export const name = Cubane.Abi.createFunctionSignature("name",Cubane.Abi.createFunctionSelectorAndArguments(Cubane.Abi.FunctionSelector.from([105,31,52,49]),Cubane.Abi.createDynamicTuple(Cubane.Abi.Bytes32)))
}
