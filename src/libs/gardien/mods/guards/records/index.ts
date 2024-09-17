import { Guard } from "../../guard"
import { Property } from "../../props"

export class RecordGuard<T extends { [k: PropertyKey]: Property<Guard<unknown, unknown>> }> {

  constructor(
    readonly guard: T
  ) { }

  asOrThrow(value: { [K in keyof T]: Guard.Input<T[K]> }): { [K in keyof T]: Guard.Input<T[K]> } & { [K in keyof T]: Guard.Output<T[K]> } {
    let cause = []

    for (const key of Reflect.ownKeys(this.guard)) {
      const guard = this.guard[key]

      if (guard instanceof Property.Optional) {
        if (key in value === false)
          continue
        if (value[key] === undefined)
          continue

        try {
          guard.value.asOrThrow(value[key])
        } catch (e: unknown) {
          cause.push(e)
        }

        continue
      }

      if (guard instanceof Property.Readonly) {
        if (key in value === false) {
          cause.push(new Error())
          continue
        }

        try {
          guard.value.asOrThrow(value[key])
        } catch (e: unknown) {
          cause.push(e)
        }

        continue
      }

      if (key in value === false) {
        cause.push(new Error())
        continue
      }

      try {
        guard.asOrThrow(value[key])
      } catch (e: unknown) {
        cause.push(e)
      }

      continue
    }

    if (cause.length > 0)
      throw new Error(undefined, { cause })

    return value as { [K in keyof T]: Guard.Input<T[K]> } & { [K in keyof T]: Guard.Output<T[K]> }
  }

}

