import { Abi } from "@hazae41/cubane"

export namespace PeanutAbi {
  export const makeDeposit = Abi.createFunctionSignature("makeDeposit",Abi.createFunctionSelectorAndArguments(Abi.FunctionSelector.from([243,71,128,17]),Abi.createTuple(Abi.Address,Abi.Int8,Abi.Int256,Abi.Int256,Abi.Address)))
}
