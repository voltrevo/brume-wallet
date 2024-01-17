import { Abi } from "@hazae41/cubane"

export namespace DatabaseAbi {
  export const get = Abi.createFunctionSignature("get",Abi.createFunctionSelectorAndArguments(Abi.FunctionSelector.from([98,162,207,12]),Abi.createTuple(Abi.Bytes4)))
  export const add = Abi.createFunctionSignature("add",Abi.createFunctionSelectorAndArguments(Abi.FunctionSelector.from([176,200,249,220]),Abi.createTuple(Abi.String)))
}

export namespace BatcherAbi {
  export const add = Abi.createFunctionSignature("add",Abi.createFunctionSelectorAndArguments(Abi.FunctionSelector.from([221,23,86,145]),Abi.createTuple(Abi.createVector(Abi.String))))
}
