import { Guard } from "../guard"
import { StringGuard } from "../guards/strings"
import { Super } from "../super"

export class Errorer<T extends Guard<any, any>> {

  constructor(
    readonly guard: T,
    readonly error: () => Error
  ) { }

  asOrThrow<T extends Guard.Coerced<any, any, any>, X>(this: Errorer<T>, value: Guard.Coerced.Strong<T>): Guard.Coerced.Output<T>;

  asOrThrow<T extends Guard.Coerced<any, any, any>, X>(this: Errorer<T>, value: Super<X, Guard.Coerced.Weak<T>>): Guard.Coerced.Output<T>;

  asOrThrow<T extends Guard<any, any>>(this: Errorer<Guard.Coerced.Reject<T>>, value: Guard.Input<T>): Guard.Output<T>;

  asOrThrow(value: Guard.Input<T>): Guard.Output<T> {
    try {
      return this.guard.asOrThrow(value)
    } catch (error) {
      throw this.error()
    }
  }

}

new Errorer(StringGuard, () => new Error("Not a string")).asOrThrow(null as unknown)