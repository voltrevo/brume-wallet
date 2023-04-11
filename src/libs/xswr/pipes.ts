import { State } from "@hazae41/xswr";

export namespace Mutator {

  export function data<D>(mutator: (d?: D) => D | undefined) {
    return (state?: State<D>) => ({ ...state, data: mutator(state?.data) })
  }

}