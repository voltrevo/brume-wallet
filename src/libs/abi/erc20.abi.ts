import { Abi } from "@hazae41/cubane"

export namespace TokenAbi {
  export const balanceOf = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([112,160,130,49]),Abi.Tuple.create(Abi.Address))
  export const transfer = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([169,5,156,187]),Abi.Tuple.create(Abi.Address,Abi.Int256))
  export const approve = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([9,94,167,179]),Abi.Tuple.create(Abi.Address,Abi.Int256))
}
