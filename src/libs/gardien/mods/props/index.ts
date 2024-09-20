import { Finalize } from "../../libs/finalize"

export type Property<T> =
  | T
  | Property.Optional<T>
  | Property.Readonly<T>

export namespace Property {

  export type AllUnwrapped<T> = AllReadonly<AllOptional<T>>

  export class Optional<T> {
    readonly #class = Optional

    constructor(
      readonly value: T
    ) { }
  }

  export type AsOptional<T, K extends keyof T> = T[K] extends Optional<unknown> ? K : never
  export type AsNotOptional<T, K extends keyof T> = T[K] extends Optional<unknown> ? never : K

  export type OfOptional<T> = T extends Optional<infer U> ? U : never
  export type OfNotOptional<T> = T extends Optional<unknown> ? never : T

  export type AllOptional<T> = Finalize<{ [K in keyof T as AsOptional<T, K>]?: OfOptional<T[K]> } & { [K in keyof T as AsNotOptional<T, K>]-?: OfNotOptional<T[K]> }>

  export class Readonly<T> {
    readonly #class = Readonly

    constructor(
      readonly value: T
    ) { }
  }

  export type AsReadonly<T, K extends keyof T> = T[K] extends Readonly<unknown> ? K : never
  export type AsNotReadonly<T, K extends keyof T> = T[K] extends Readonly<unknown> ? never : K

  export type OfReadonly<T> = T extends Readonly<infer U> ? U : never
  export type OfNotReadonly<T> = T extends Readonly<unknown> ? never : T

  export type AllReadonly<T> = Finalize<{ readonly [K in keyof T as AsReadonly<T, K>]: OfReadonly<T[K]> } & { -readonly [K in keyof T as AsNotReadonly<T, K>]: OfNotReadonly<T[K]> }>

}