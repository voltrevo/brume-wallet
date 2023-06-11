import { Err } from "@hazae41/result"

export interface RawError {
  message: string
}

export namespace RawError {

  export function from(error: Error): RawError {
    const { message } = error
    return { message }
  }

}

export interface RpcErrInit {
  readonly jsonrpc: "2.0"
  readonly id: number
  readonly error: RawError
}

export namespace RpcErrInit {

  export function from(response: RpcErr): RpcErrInit {
    const { jsonrpc, id } = response
    const error = RawError.from(response.error)
    return { jsonrpc, id, error }
  }

}

export class RpcErr extends Err<Error> {
  readonly jsonrpc = "2.0"

  constructor(
    readonly id: number,
    readonly error: Error
  ) {
    super(error)
  }

  static from(init: RpcErrInit) {
    return new RpcErr(init.id, new Error(init.error.message))
  }

}