
/**
 * State<T> or Result<T>
 */
export interface Data<T> {
  data?: T
}

export function dataPipe<D = any, R = D>(mutator: (d?: D) => R | undefined) {
  return (holder?: Data<D>) => ({ data: mutator(holder?.data) })
}

