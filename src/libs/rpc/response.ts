import { Result } from "@hazae41/result"
import { RpcErr, RpcErrInit } from "./err"
import { RpcOk, RpcOkInit } from "./ok"

export type RpcResponseInit<T = unknown> =
  | RpcOkInit<T>
  | RpcErrInit

export namespace RpcResponseInit {

  export function from<T>(response: RpcResponse<T>) {
    if (response.isErr())
      return RpcErrInit.from(response)
    return RpcOkInit.from(response)
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

  export function rewrap<T extends Result.Infer<T>>(id: number, result: T) {
    result.ignore()

    if (result.isOk())
      return new RpcOk(id, result.inner)
    if (result.inner instanceof Error)
      return new RpcErr(id, result.inner)
    return new RpcErr(id, new Error())
  }

}