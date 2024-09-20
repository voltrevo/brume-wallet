import { ZeroHexStringGuard } from "../.."
import { Guard } from "../../guard"
import { Property } from "../../props"
import { Infer, Super } from "../../super"
import { NumberGuard } from "../primitives"
import { StringGuard } from "../strings"

export class RecordGuard<T extends { [k: PropertyKey]: Property<Guard<any, any>> }> {

  constructor(
    readonly guard: T
  ) { }

  asOrThrow<T extends { [k: PropertyKey]: Property<Guard.Casted<any, any, any>> }, X extends Guard.Casted.AllStrongOrSelf<Property.AllUnwrapped<T>>>(this: RecordGuard<T>, value: X): X

  asOrThrow<T extends { [k: PropertyKey]: Property<Guard.Casted<any, any, any>> }, X extends Guard.Casted.AllWeakOrSelf<Property.AllUnwrapped<T>>>(this: RecordGuard<T>, value: Super<Infer<X>, Guard.Casted.AllStrongOrSelf<Property.AllUnwrapped<T>>>): Guard.Casted.AllOutputOrSelf<Property.AllUnwrapped<T>>

  // asOrThrow<T extends { [k: PropertyKey]: Property<Guard.Overloaded<any, any, any>> }, X extends Guard.Overloaded.AllStrong<Property.AllUnwrapped<T>>>(this: RecordGuard<Exclude<T, { [k: PropertyKey]: Property<Guard.Casted<any, any, any>> }>>, value: X): Guard.Overloaded.AllOutput<Property.AllUnwrapped<T>>

  // asOrThrow<T extends { [k: PropertyKey]: Property<Guard.Overloaded<any, any, any>> }, X extends Guard.Overloaded.AllWeak<Property.AllUnwrapped<T>>>(this: RecordGuard<Exclude<T, { [k: PropertyKey]: Property<Guard.Casted<any, any, any>> }>>, value: Super<Infer<X>, Guard.Overloaded.AllStrong<Property.AllUnwrapped<T>>>): Guard.Overloaded.AllOutput<Property.AllUnwrapped<T>>

  asOrThrow<T extends { [k: PropertyKey]: Property<Guard<any, any>> }>(this: RecordGuard<Exclude<T, { [k: PropertyKey]: Property<Guard.Overloaded<any, any, any>> }>>, value: Guard.AllInputOrSelf<Property.AllUnwrapped<T>>): Guard.AllOutputOrSelf<Property.AllUnwrapped<T>>

  asOrThrow(value: Guard.AllInputOrSelf<Property.AllUnwrapped<T>>): Guard.AllOutputOrSelf<Property.AllUnwrapped<T>> {
    const result: Record<PropertyKey, unknown> = {}

    let cause = []

    for (const key of Reflect.ownKeys(this.guard)) {
      const guard = this.guard[key]

      if (guard instanceof Property.Optional) {
        if (key in value === false)
          continue
        if ((value as any)[key] === undefined)
          continue

        try {
          result[key] = guard.value.asOrThrow((value as any)[key])
          continue
        } catch (e: unknown) {
          cause.push(e)
          continue
        }
      }

      if (guard instanceof Property.Readonly) {
        if (key in value === false) {
          cause.push(new Error())
          continue
        }

        try {
          result[key] = guard.value.asOrThrow((value as any)[key])
          continue
        } catch (e: unknown) {
          cause.push(e)
          continue
        }
      }

      if (key in value === false) {
        cause.push(new Error())
        continue
      }

      try {
        result[key] = guard.asOrThrow((value as any)[key])
        continue
      } catch (e: unknown) {
        cause.push(e)
        continue
      }
    }

    if (cause.length > 0)
      throw new Error(undefined, { cause })

    return result as Guard.AllOutput<Property.AllUnwrapped<T>>
  }

}

new RecordGuard({
  a: new Property.Optional(StringGuard),
  b: NumberGuard,
  c: ZeroHexStringGuard
}).asOrThrow({
  a: "0",
  b: null as unknown,
  c: "0x0"
})