import { Abi } from "@hazae41/cubane"

export namespace ERC20Abi {
  export const balanceOf = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([112,160,130,49]),Abi.Tuple.create(Abi.Address))
  export const transfer = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([169,5,156,187]),Abi.Tuple.create(Abi.Address,Abi.Int256))
  export const approve = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([9,94,167,179]),Abi.Tuple.create(Abi.Address,Abi.Int256))
}

export namespace ERC20MetadataAbi {
  export const name = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([6,253,222,3]),Abi.Tuple.create())
  export const symbol = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([149,216,155,65]),Abi.Tuple.create())
  export const decimals = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([49,60,229,103]),Abi.Tuple.create())
}