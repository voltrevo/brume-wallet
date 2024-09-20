import { Guard } from "../guard"
import { ElementsGuard } from "../guards"
import { StringGuard } from "../guards/strings"
import { Resolve, Super } from "../super"

export class Errorer<T extends Guard<any, any>> {

  constructor(
    readonly guard: T,
    readonly error: () => Error
  ) { }

  asOrThrow<X extends Guard.Overloaded.Strong<T>>(value: X): Guard.Output<T>

  asOrThrow<X extends Guard.Overloaded.Weak<T>>(value: Super<Resolve<X>, Guard.Overloaded.Strong<T>>): Guard.Output<T>

  asOrThrow(this: Errorer<Guard.Infer<T>>, value: Guard.Overloaded.Weak<T>): Guard.Output<T> {
    try {
      return this.guard.asOrThrow(value)
    } catch (error) {
      throw this.error()
    }
  }

}


type lol = Super<unknown[], readonly string[]>

new Errorer(new ElementsGuard(StringGuard), () => new Error()).asOrThrow([""])

class Simple {
  // asOrThrow(value: number): string;
  asOrThrow(value: number): string;

  asOrThrow(value: number): string {
    return value.toString()
  }
}

const x = new ElementsGuard(StringGuard)

type X = Guard.Overloaded.Strong<typeof x>
type Y = Guard.Overloaded.Weak<typeof x>


class Overload {
  asOrThrow<X extends 123>(value: X): 123
  asOrThrow<X extends number>(value: Super<Resolve<X>, 123>): 123

  asOrThrow(value: number): 123 {
    return value as 123
  }
}

class Cast {
  asOrThrow<X extends 123>(value: X): X
  asOrThrow<X extends 123>(value: X): 123
  asOrThrow<X extends number>(value: Super<Resolve<X>, 123>): 123

  asOrThrow(value: number): 123 {
    return value as 123
  }
}

type A = Guard.Casted.Strong<Cast>
type B = Guard.Overloaded.Strong<Cast>

type C = Guard.Casted.Strong<Overload>
type D = Guard.Overloaded.Strong<Overload>

type E = Guard.Casted.Output<Overload>
type F = Guard.Overloaded.Output<Overload>

type G = Guard.Casted.Output<Cast>
type H = Guard.Overloaded.Output<Cast>