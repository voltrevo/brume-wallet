import { Err } from "@hazae41/result"

export interface RawError {
  message: string
}

export interface RpcErrInit {
  readonly jsonrpc: "2.0"
  readonly id: number
  readonly error: RawError
}

export class RpcErr extends Err<Error> {

  constructor(
    readonly id: number,
    readonly error: Error
  ) {
    super(error)
  }

  static from(init: RpcErrInit) {
    const error = new Error(init.error.message)

    return new this(init.id, error)
  }

}