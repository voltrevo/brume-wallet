export interface PoolEntry<T> {
  index: number,
  element: T
}

export type PoolEvents<T> = {
  element: MessageEvent<PoolEntry<T>>
}