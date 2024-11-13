import { Abi } from "@hazae41/cubane"

export namespace PairAbiV2 {
  export const getReserves = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([9,2,241,172]),Abi.Tuple.create())
}

export namespace PairAbiV3 {
  export const slot0 = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([56,80,199,189]),Abi.Tuple.create())
}