import { Ok } from "@hazae41/result"

export interface RpcOkInit<T = unknown> {
  readonly jsonrpc: "2.0"
  readonly id: number,
  readonly result: T
}

export class RpcOk<T = unknown> extends Ok<T> {

  readonly error?: undefined

  constructor(
    readonly id: number,
    readonly result: T
  ) {
    super(result)
  }

  static from<T>(init: RpcOkInit<T>) {
    const { id, result } = init

    return new this(id, result)
  }

}
