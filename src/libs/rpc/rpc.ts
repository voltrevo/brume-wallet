import { Future } from "@hazae41/future"
import { Sockets } from "../sockets/sockets"
import { Request, RequestInit } from "./request"
import { Response, ResponseInit } from "./response"

export * from "./request"
export * from "./response"

export class Client {

  #id = 0

  constructor() { }

  get id() {
    return this.#id
  }

  request(init: RequestInit): Request {
    const { method, params } = init

    const id = this.#id++

    return { jsonrpc: "2.0", id, method, params }
  }

  async requestWithSocket<T>(init: RequestInit, socket: WebSocket, signal?: AbortSignal) {
    return await fetchWithSocket<T>(this.request(init), socket, signal)
  }

}

export async function fetchWithSocket<T>(request: Request, socket: WebSocket, signal?: AbortSignal) {
  socket.send(JSON.stringify(request))

  const future = new Future<Response<T>>()

  const onEvent = async (event: Event) => {
    const msgEvent = event as MessageEvent<string>
    const response = JSON.parse(msgEvent.data) as ResponseInit<T>
    if (response.id !== request.id) return
    future.resolve(Response.from(response))
  }

  return await Sockets.waitMap(socket, "message", { future, onEvent, signal })
}
