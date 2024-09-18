import { Coerced } from "../../coerce"
import { Guard } from "../../guard"

export class UnionGuard<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  asOrThrow<X>(value: Coerced<X, I, Guard.Output<A> | Guard.Output<B>>): X & (Guard.Output<A> | Guard.Output<B>) {
    let cause = []

    try {
      return this.left.asOrThrow(value) as X & Guard.Output<A>
    } catch (e: unknown) {
      cause.push(e)
    }

    try {
      return this.right.asOrThrow(value) as X & Guard.Output<B>
    } catch (e: unknown) {
      cause.push(e)
    }

    throw new Error(undefined, { cause })
  }

}

export class InterGuard<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  asOrThrow<X>(value: Coerced<X, I, Guard.Output<A> & Guard.Output<B>>): X & Guard.Output<A> & Guard.Output<B> {
    let cause = []

    try {
      this.left.asOrThrow(value)
    } catch (e: unknown) {
      cause.push(e)
    }

    try {
      this.right.asOrThrow(value)
    } catch (e: unknown) {
      cause.push(e)
    }

    if (cause.length > 0)
      throw new Error(undefined, { cause })

    return value as X & Guard.Output<A> & Guard.Output<B>
  }

}

export class ThenGuard<M, A extends Guard<unknown, M>, B extends Guard<M, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  asOrThrow<X>(value: Coerced<X, Guard.Input<A>, Guard.Output<A>>): X & Guard.Output<A> & Guard.Output<B> {
    return this.right.asOrThrow(this.left.asOrThrow(value)) as X & Guard.Output<A> & Guard.Output<B>
  }

}