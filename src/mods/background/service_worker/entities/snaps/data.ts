import { RpcErr, RpcError, RpcOk, RpcRequestInit, RpcResponse } from "@hazae41/jsonrpc"
import { Result } from "@hazae41/result"
import { createSnap } from "./glue"

export interface SnapData {
  readonly uuid: string
  readonly name: string

  readonly bytecodeBase64: string
  readonly signatureBase64: string
}

export class SnapError extends Error {
  readonly #class = SnapError
  readonly name = this.#class.name

  constructor(options: ErrorOptions) {
    super(`Could not execute`, options)
  }

  static from(cause: unknown) {
    return new SnapError({ cause })
  }

}

declare class RustSnap {
  constructor(context: RustSnapContext)
  on_request(req: string): string
}

export class RustSnapFactory {
  readonly snap: typeof RustSnap

  constructor(
    readonly bytecode: Uint8Array
  ) {
    this.snap = createSnap(this.bytecode)
  }

  create(context: RustSnapContext) {
    const snap = new this.snap(context)

    return new RustSnapWrapper(snap)
  }

}

export class RustSnapContext {

  constructor() { }

  request(req: string) {
    const request = JSON.parse(req)

    const response = Result.runAndWrap(() => {
      return this.#onRequest(request)
    }).then(r => RpcResponse.rewrap(null, r))

    return JSON.stringify(response)
  }

  #onRequest(request: RpcRequestInit<unknown>) {
    if (request.method === "log") {
      console.log(...request.params as unknown[])
      return
    }

    if (request.method === "brume_addChain") {
      // const [logo] = (request as RpcRequestInit<[]>).params
    }

    throw new Error(`Unknown method ${request.method}`)
  }

}

export class RustSnapWrapper {

  constructor(
    /**
     * The WebAssembly module
     */
    readonly inner: RustSnap
  ) { }

  request<T>(request: RpcRequestInit<unknown>) {
    try {
      const req = JSON.stringify(request)
      const ret = this.inner.on_request(req)
      const res = JSON.parse(ret)

      return new RpcOk<T>(request.id, res)
    } catch (e: unknown) {
      return new RpcErr(request.id, RpcError.rewrap(e))
    }
  }

}