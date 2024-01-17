import { Abi } from "@hazae41/cubane"

export namespace DatabaseAbi {
  export const get = Abi.createFunctionSignature("get",Abi.createFunctionSelectorAndArguments(Abi.FunctionSelector.from([98,162,207,12]),Abi.createTuple(Abi.Bytes4)))
}
