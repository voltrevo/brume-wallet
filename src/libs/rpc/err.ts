import { Err } from "@hazae41/result"
import { RpcId } from "./request"

export interface ErrorInit {
  readonly message: string
}

export interface RpcErrInit {
  readonly jsonrpc: "2.0"
  readonly id: RpcId
  readonly error: ErrorInit
}

export class RpcError extends Error {

  static from(error: Error) {
    const { message, name, cause, stack } = error

    const rpcError = new RpcError(message, { cause })

    rpcError.name = name
    rpcError.stack = stack

    return rpcError
  }

  toJSON() {
    const { message } = this
    return { message }
  }

}

export class RpcErr extends Err<RpcError> {
  readonly jsonrpc = "2.0"

  constructor(
    readonly id: RpcId,
    readonly error: RpcError
  ) {
    super(error)
  }

  static from(init: RpcErrInit) {
    return new RpcErr(init.id, new RpcError(init.error.message))
  }

}