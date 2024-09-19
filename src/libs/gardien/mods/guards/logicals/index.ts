import { Guard } from "../../guard"

export class UnionGuard<I, A, B> {

  constructor(
    readonly left: Guard<I, A>,
    readonly right: Guard<I, B>
  ) { }

  asOrThrow(value: I): (A | B) {
    let cause = []

    try {
      return this.left.asOrThrow(value)
    } catch (e: unknown) {
      cause.push(e)
    }

    try {
      return this.right.asOrThrow(value)
    } catch (e: unknown) {
      cause.push(e)
    }

    throw new Error(undefined, { cause })
  }

}

export class InterGuard<I, M, O> {

  constructor(
    readonly left: Guard<I, M>,
    readonly right: Guard<M, O>
  ) { }

  asOrThrow(value: I): O {
    return this.right.asOrThrow(this.left.asOrThrow(value))
  }

}