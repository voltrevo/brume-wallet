import { Abi } from "@hazae41/cubane"

export namespace RankingAbi {
  export const addressOf = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([17,168,0,188]),Abi.Tuple.create(Abi.Int256))
}

export namespace RegistryAbi {
  export const registry = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([3,141,239,215]),Abi.Tuple.create(Abi.Address))
}