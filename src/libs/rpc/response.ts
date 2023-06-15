import { Err, Ok, Result } from "@hazae41/result"
import { RpcErr, RpcErrInit, RpcError } from "./err"
import { RpcOk, RpcOkInit } from "./ok"
import { RpcId } from "./request"

export type RpcResponseInit<T = unknown> =
  | RpcOkInit<T>
  | RpcErrInit

export namespace RpcResponseInit {

  export function clone<T>(init: RpcResponseInit<T>) {
    if ("error" in init)
      return RpcErrInit.clone(init)
    return RpcOkInit.clone(init)
  }

}

export type RpcResponse<T = unknown> =
  | RpcOk<T>
  | RpcErr

export namespace RpcResponse {

  export function from<T>(init: RpcResponseInit<T>) {
    if ("error" in init)
      return RpcErr.from(init)
    return RpcOk.from(init)
  }

  export function rewrap<T extends Ok.Infer<T>>(id: RpcId, result: T): RpcOk<Ok.Inner<T>>

  export function rewrap<T extends Err.Infer<T>>(id: RpcId, result: T): RpcErr

  export function rewrap<T extends Result.Infer<T>>(id: RpcId, result: T): RpcResponse<Ok.Inner<T>>

  export function rewrap<T extends Result.Infer<T>>(id: RpcId, result: T): RpcResponse<Ok.Inner<T>> {
    result.ignore()

    if (result.isOk())
      return new RpcOk(id, result.inner)

    if (result.inner instanceof Error)
      return new RpcErr(id, RpcError.from(result.inner))

    return new RpcErr(id, new RpcError())
  }

}