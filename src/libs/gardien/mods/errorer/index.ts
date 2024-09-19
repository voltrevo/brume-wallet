import { Coerced } from "../coerce"
import { Guard } from "../guard"

export class Errorer<T extends Guard<unknown, unknown>> {

  constructor(
    readonly guard: T,
    readonly error: () => Error
  ) { }

  asOrThrow<X>(value: Coerced.Input<T["asOrThrow"], X, Guard.Input<T>, Guard.Output<T>>): Coerced.Output<T["asOrThrow"], X, Guard.Input<T>, Guard.Output<T>> {
    try {
      return this.guard.asOrThrow(value) as Coerced.Output<T["asOrThrow"], X, Guard.Input<T>, Guard.Output<T>>
    } catch (error) {
      throw this.error()
    }
  }

}