import { Err, ErrInit } from "./err"
import { Ok, OkInit } from "./ok"

export * from "./err"
export * from "./ok"

export type Init<T = unknown> =
  | OkInit<T>
  | ErrInit

export function from<T>(init: Init<T>) {
  if (init.error !== undefined)
    return Err.from(init)
  else
    return Ok.from(init)
}