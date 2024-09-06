import { Pool, PoolCreator } from "@hazae41/piscine";

export class AutoPool<T, N extends number = number> extends Pool<T> {

  constructor(
    readonly factory: PoolCreator<T>,
    readonly capacity: N,
  ) {
    super(factory)

    for (let i = 0; i < capacity; i++)
      this.start(i)

    return this
  }

}