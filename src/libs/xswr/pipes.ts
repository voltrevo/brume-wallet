import { State } from "@hazae41/xswr";

export namespace Pipes {

  export function data<D>(mutator: (d?: D) => D | undefined) {
    return (state?: State<D>) => ({ ...state, data: mutator(state?.data) })
  }

}