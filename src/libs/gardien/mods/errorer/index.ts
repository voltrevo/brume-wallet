import { Guard } from "../guard"
import { ElementsGuard } from "../guards"
import { StringGuard } from "../guards/strings"
import { Infer, Super } from "../super"

export class Errorer<T extends Guard<any, any>> {

  constructor(
    readonly guard: T,
    readonly error: () => Error
  ) { }

  asOrThrow<T extends Guard.Casted<any, any, any>, X extends Guard.Casted.Strong<T>>(this: Errorer<T>, value: X): X

  asOrThrow<T extends Guard.Casted<any, any, any>, X extends Guard.Casted.Weak<T>>(this: Errorer<T>, value: Super<Infer<X>, Guard.Casted.Strong<T>>): Guard.Casted.Output<T>

  asOrThrow<T extends Guard.Overloaded<any, any, any>, X extends Guard.Overloaded.Strong<T>>(this: Errorer<Exclude<T, Guard.Casted<any, any, any>>>, value: X): Guard.Overloaded.Output<T>

  asOrThrow<T extends Guard.Overloaded<any, any, any>, X extends Guard.Overloaded.Weak<T>>(this: Errorer<Exclude<T, Guard.Casted<any, any, any>>>, value: Super<Infer<X>, Guard.Overloaded.Strong<T>>): Guard.Overloaded.Output<T>

  asOrThrow<T extends Guard<any, any>>(this: Errorer<Exclude<T, Guard.Overloaded<any, any, any>>>, value: Guard.Input<T>): Guard.Output<T>

  asOrThrow(this: Errorer<Guard.Infer<T>>, value: Guard.Input<T>): Guard.Output<T> {
    try {
      return this.guard.asOrThrow(value)
    } catch (error) {
      throw this.error()
    }
  }

}

new Errorer(new ElementsGuard(StringGuard), () => new Error()).asOrThrow([122])

const x = new ElementsGuard(StringGuard)

type D = Guard.Casted.Output<typeof x>

class Test {
  asOrThrow<X extends unknown>(value: number | Super<Infer<X>, number>): string

  asOrThrow(value: number): string {
    return value.toString()
  }
}

new Test().asOrThrow(123)

type X = Guard.Casted.Strong<Test>
type Y = Guard.Casted.Strong<ElementsGuard<Test>>