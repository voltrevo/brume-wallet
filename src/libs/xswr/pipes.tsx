import { Result } from "@hazae41/xswr"

export namespace Results {

  export function map<D, R>(result: Result<D>, mutator: (d: D) => R) {
    const data = result.data !== undefined
      ? mutator(result.data)
      : undefined
    return { ...result, data } as Result<R>
  }

}


