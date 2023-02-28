import { Cursor } from "@hazae41/binary"
import { XSWR } from "@hazae41/xswr"
import { Future } from "../futures/future"
import { WebSockets } from "../websockets/websockets"

export namespace RPC {

  export interface RequestInit<T extends unknown[] = unknown[]> {
    readonly method: string,
    readonly params: T
  }

  export class Request<T> {
    readonly jsonrpc = "2.0"
    readonly id = Cursor.random(4).readUint32()

    readonly method: string
    readonly params: unknown[]

    constructor(params: RequestInit) {
      this.method = params.method
      this.params = params.params
    }

    async query(socket: WebSocket, signal?: AbortSignal) {
      socket.send(JSON.stringify(this))

      const future = new Future<RPC.Response<T>>()

      const onEvent = async (event: Event) => {
        const msgEvent = event as MessageEvent<string>
        const response = JSON.parse(msgEvent.data) as RPC.Response<T>
        if (response.id === this.id) future.ok(response)
      }

      return await WebSockets.waitFor("message", { socket, future, onEvent, signal })
    }
  }

  export type Response<T = any> =
    | OkResponse<T>
    | ErrResponse

  export interface OkResponse<T = any> {
    id: number,
    result: T
    error?: undefined
  }

  export interface ErrResponse {
    id: number
    result?: undefined
    error: { message: string }
  }

  export function unwrap<T>(response: Response<T>) {
    if (response.error)
      throw new Error(response.error.message)
    return response.result
  }

  export function rewrap<T>(response: Response<T>): XSWR.Result<T> {
    if (response.error) {
      const error = new Error(response.error.message)
      return { error }
    }

    const data = response.result
    return { data }
  }

}
