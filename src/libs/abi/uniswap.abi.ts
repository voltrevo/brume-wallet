import { Abi } from "@hazae41/cubane"

export namespace UniswapV2PoolAbi {
  export const getReserves = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([9,2,241,172]),Abi.Tuple.create())
}

export namespace UniswapV3PoolAbi {
  export const slot0 = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([56,80,199,189]),Abi.Tuple.create())

  export const token0 = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([13,254,22,129]),Abi.Tuple.create())
  export const token1 = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([210,18,32,167]),Abi.Tuple.create())
}

export namespace UniswapV3FactoryAbi {
  export const getPool = Abi.FunctionSelectorAndArguments.create(Abi.FunctionSelector.fromOrThrow([22,152,238,130]),Abi.Tuple.create(Abi.Address,Abi.Address,Abi.Int24))
}