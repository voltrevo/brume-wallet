import { Abi } from "@hazae41/cubane"

export namespace TokenAbi {
  export const balanceOf = Abi.createFunctionSignature("balanceOf",Abi.createFunctionSelectorAndArguments(Abi.FunctionSelector.from([112,160,130,49]),Abi.createTuple(Abi.Address)))
  export const transfer = Abi.createFunctionSignature("transfer",Abi.createFunctionSelectorAndArguments(Abi.FunctionSelector.from([169,5,156,187]),Abi.createTuple(Abi.Address,Abi.Int256)))
  export const approve = Abi.createFunctionSignature("approve",Abi.createFunctionSelectorAndArguments(Abi.FunctionSelector.from([9,94,167,179]),Abi.createTuple(Abi.Address,Abi.Int256)))
}
