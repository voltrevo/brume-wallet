export interface Data<T> {
  data?: T
}

export namespace Pipes {

  export function data<D = any, R = D>(mutator: (d?: D) => R | undefined) {
    return (holder?: Data<D>) => ({ data: mutator(holder?.data) })
  }

}


