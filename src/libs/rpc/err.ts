import { Err } from "@hazae41/result"
import { RpcId } from "./request"

export interface RpcErrorInit {
  readonly message: string
}

export interface RpcErrInit {
  readonly jsonrpc: "2.0"
  readonly id: RpcId
  readonly error: RpcErrorInit
}

export class RpcError extends Error {

  static from(error: Error) {
    return new RpcError(error.message)
  }

  /**
   * Used by JSON.stringify
   */
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