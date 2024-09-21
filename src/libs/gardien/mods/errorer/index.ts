import { Guard } from "../guard"
import { ElementsGuard } from "../guards"
import { LengthGuard } from "../guards/lengths"
import { StringGuard } from "../guards/strings"
import { IsSame } from "../same"
import { Intersect, Super } from "../super"

export class Errorer<T extends Guard<any, any>> {

  constructor(
    readonly guard: T,
    readonly error: () => Error
  ) { }

  asOrThrow<X extends Guard.Overloaded.Strong<T>>(value: X): IsSame<Guard.Overloaded.Strong<T>, Guard.Overloaded.Output<T>> extends true ? X : Guard.Overloaded.Output<T>

  asOrThrow<X extends Guard.Overloaded.Weak<T>>(value: Super<X, Intersect<X, Guard.Overloaded.Strong<T>>>): IsSame<Guard.Overloaded.Strong<T>, Guard.Overloaded.Output<T>> extends true ? Intersect<X, Guard.Overloaded.Output<T>> : Guard.Overloaded.Output<T>

  asOrThrow(this: Errorer<Guard.Overloaded.Infer<T>>, value: Guard.Overloaded.Weak<T>): Guard.Overloaded.Output<T> {
    try {
      return this.guard.asOrThrow(value)
    } catch (error) {
      throw this.error()
    }
  }

}

new Errorer(new LengthGuard(3), () => new Error()).asOrThrow([1, 2, 3])

new ElementsGuard(StringGuard).asOrThrow([null as unknown])
type Z = Intersect<[unknown], string[]>