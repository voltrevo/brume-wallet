import { Result } from "@hazae41/xswr"

export namespace Results {

  export function map<D, R>(result: Result<D>, mutator: (d: D) => R) {
    if ("data" in result) {
      const data = result.data !== undefined
        ? mutator(result.data)
        : undefined
      return { ...result, data } as Result<R>
    } else {
      return result
    }
  }

}


