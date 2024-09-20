import { Guard } from "../guard"
import { Infer, Super } from "../super"

export class Errorer<T extends Guard<any, any>> {

  constructor(
    readonly guard: T,
    readonly error: () => Error
  ) { }

  asOrThrow<T extends Guard.Casted<any, any, any>, X extends Guard.Casted.Strong<T>>(this: Errorer<T>, value: X): X

  asOrThrow<T extends Guard.Casted<any, any, any>, X extends Guard.Casted.Weak<T>>(this: Errorer<T>, value: Super<Infer<X>, Guard.Casted.Strong<T>>): Guard.Casted.Output<T>

  asOrThrow<T extends Guard.Overloaded<any, any, any>, X extends Guard.Overloaded.Strong<T>>(this: Errorer<Guard.Casted.Reject<T>>, value: X): Guard.Overloaded.Output<T>

  asOrThrow<T extends Guard.Overloaded<any, any, any>, X extends Guard.Overloaded.Weak<T>>(this: Errorer<Guard.Casted.Reject<T>>, value: Super<Infer<X>, Guard.Overloaded.Strong<T>>): Guard.Overloaded.Output<T>

  asOrThrow<T extends Guard<any, any>>(this: Errorer<Guard.Overloaded.Reject<T>>, value: Guard.Input<T>): Guard.Output<T>

  asOrThrow(this: Errorer<Guard.Infer<T>>, value: Guard.Input<T>): Guard.Output<T> {
    try {
      return this.guard.asOrThrow(value)
    } catch (error) {
      throw this.error()
    }
  }

}
