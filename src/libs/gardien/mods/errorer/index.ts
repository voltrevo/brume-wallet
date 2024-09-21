import { Guard } from "../guard"
import { ElementsGuard } from "../guards"
import { StringGuard } from "../guards/strings"
import { Resolve, Super } from "../super"

class Simple {
  asOrThrow(value: number): string;

  asOrThrow(value: number): string {
    return value.toString()
  }
}

class Overloaded {
  asOrThrow(value: number): string

  asOrThrow<X>(value: Super<Resolve<X>, number>): string

  asOrThrow(value: unknown): string {
    return value as string
  }
}

class Casted {
  is<X extends number>(value: X): value is X

  is<X extends unknown>(value: Super<Resolve<X>, number>): value is Super<Resolve<X>, number> & number

  is(value: unknown): value is number {
    return typeof value === "number"
  }

  asOrThrow<X extends number>(value: X): X

  asOrThrow<X extends unknown>(value: Super<Resolve<X>, number>): number

  asOrThrow(value: unknown): number {
    return value as number
  }
}

export type Mutable<T> = T extends readonly (infer U)[] ? U[] : T

export class Errorer<T extends Guard<any, any>> {

  constructor(
    readonly guard: T,
    readonly error: () => Error
  ) { }

  is<X extends Guard.Casted.Strong<T>>(value: X): value is X

  is<X extends Guard.Casted.Weak<T>>(value: Super<Resolve<X>, Guard.Casted.Strong<T>>): value is Guard.Casted.Strong<T>

  is(this: Errorer<Guard.Casted.Infer<T>>, value: Guard.Casted.Weak<T>): value is Guard.Casted.Strong<T> {
    return this.guard.is(value)
  }

  asOrThrow<X extends Guard.Overloaded.Strong<T>>(value: X): T extends Guard.Casted<any, any> ? X : Guard.Overloaded.Output<T>

  asOrThrow<X extends Guard.Overloaded.Weak<T>>(value: Super<Resolve<X>, Mutable<Guard.Overloaded.Strong<T>>>): Guard.Overloaded.Output<T>

  asOrThrow(this: Errorer<Guard.Overloaded.Infer<T>>, value: Guard.Overloaded.Weak<T>): Guard.Overloaded.Output<T> {
    try {
      return this.guard.asOrThrow(value)
    } catch (error) {
      throw this.error()
    }
  }

}

new Errorer(new Simple(), () => new Error()).asOrThrow(123)
new Errorer(new Overloaded(), () => new Error()).asOrThrow(123)
new Errorer(new Casted(), () => new Error()).is(123)
new Errorer(new Errorer(new Casted(), () => new Error()), () => new Error()).is(123)

new ElementsGuard(StringGuard).is([null as unknown])


// new Errorer(new ElementsGuard(StringGuard), () => new Error()).asOrThrow([null as unknown] as const)

const Tuple = <T extends [any, ...any]>(v: T) => v