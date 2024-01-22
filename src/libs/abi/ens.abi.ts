import { Abi } from "@hazae41/cubane"

export namespace EnsAbi {
  export const resolver = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.from([1,120,184,191]),Abi.Tuple.create(Abi.Bytes32))
  export const addr = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.from([59,59,87,222]),Abi.Tuple.create(Abi.Bytes32))
  export const name = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.from([105,31,52,49]),Abi.Tuple.create(Abi.Bytes32))
}
