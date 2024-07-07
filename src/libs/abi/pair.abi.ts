import { Abi } from "@hazae41/cubane"

export namespace PairAbi {
  export const getReserves = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([9,2,241,172]),Abi.Tuple.create())
}
