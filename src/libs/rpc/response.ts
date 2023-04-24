import { Err, Ok } from "@hazae41/result"

export type ResponseInit<T> =
  | Response.OkInit<T>
  | Response.ErrInit

export type Response<T = unknown> =
  | Response.RpcOk<T>
  | Response.RpcErr

export interface RawError {
  message: string
}

export namespace Response {

  export function from<T>(init: ResponseInit<T>) {
    if ("error" in init)
      return RpcErr.from(init)
    else
      return RpcOk.from(init)
  }

  export interface OkInit<T = unknown> {
    id: number,
    result: T
  }

  export class RpcOk<T = unknown> extends Ok<T> {

    readonly error?: undefined

    constructor(
      readonly id: number,
      readonly result: T
    ) {
      super(result)
    }

    static from<T>(init: OkInit<T>) {
      const { id, result } = init
      return new this(id, result)
    }

  }

  export interface ErrInit {
    id: number
    error: RawError
  }

  export class RpcErr extends Err<RawError> {

    constructor(
      readonly id: number,
      readonly error: RawError
    ) {
      super(error)
    }

    static from(init: ErrInit) {
      const { id, error } = init
      return new this(id, error)
    }

  }
}