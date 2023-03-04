import { Err, ErrInit } from "./err"
import { Ok, OkInit } from "./ok"

export * from "./err"
export * from "./ok"

export type Init<T> =
  | OkInit<T>
  | ErrInit

export function from<T>(init: Init<T>) {
  if ("error" in init)
    return Err.from(init)
  else
    return Ok.from(init)
}

export async function wrap<T>(callback: () => Promise<T>) {
  try {
    return new Ok(await callback())
  } catch (e: unknown) {
    return new Err(e)
  }
}

export function wrapSync<T>(callback: () => T) {
  try {
    return new Ok(callback())
  } catch (e: unknown) {
    return new Err(e)
  }
}