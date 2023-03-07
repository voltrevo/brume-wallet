import { Result } from "@hazae41/xswr"

export namespace Results {

  export function map<D, R>(result: Result<D>, mutator: (d: D) => R) {
    if ("data" in result) {
      const data = mutator(result.data)
      return { ...result, data } as Result<R>
    } else {
      return result
    }
  }

}


