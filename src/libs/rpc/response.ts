import { Result } from "../result"

export type ResponseInit<T> =
  | Response.OkInit<T>
  | Response.ErrInit

export type Response<T = unknown> =
  | Response.Ok<T>
  | Response.Err

export namespace Response {

  export function from<T>(init: ResponseInit<T>) {
    if ("error" in init)
      return Err.from(init)
    else
      return Ok.from(init)
  }

  export interface OkInit<T = unknown> {
    id: number,
    result: T
  }

  export class Ok<T = unknown> {

    readonly error?: undefined

    constructor(
      readonly id: number,
      readonly result: T
    ) { }

    static from<T>(init: OkInit<T>) {
      const { id, result } = init
      return new this(id, result)
    }

    unwrap() {
      return this.result
    }

    rewrap() {
      return new Result.Ok(this.result)
    }

  }

  export interface ErrInit {
    id: number
    error: { message: string }
  }

  export class Err {

    constructor(
      readonly id: number,
      readonly error: { message: string }
    ) { }

    static from(init: ErrInit) {
      const { id, error } = init
      return new this(id, error)
    }

    unwrap(): never {
      throw new Error(this.error.message)
    }

    rewrap() {
      return new Result.Err(this.error)
    }

  }
}