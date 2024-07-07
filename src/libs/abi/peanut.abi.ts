import { Abi } from "@hazae41/cubane"

export namespace PeanutAbi {
  export const makeDeposit = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([243,71,128,17]),Abi.Tuple.create(Abi.Address,Abi.Int8,Abi.Int256,Abi.Int256,Abi.Address))
}
