
export namespace RPC {

  export interface RequestWithInfo<T extends unknown[] = unknown[]> extends Request<T> {
    endpoint: RequestInfo | URL
  }

  export interface Request<T extends unknown[] = unknown[]> {
    method: string,
    params: T
  }

  export type Response<T = any> =
    | OkResponse<T>
    | ErrResponse

  export interface OkResponse<T = any> {
    result: T
    error?: undefined
  }

  export interface ErrResponse {
    result?: undefined
    error: { message: string }
  }

  export async function fetch<T>(input: RPC.RequestWithInfo, init: RequestInit, subfetch = globalThis.fetch) {
    const { endpoint, method, params } = input
    const { signal, cache } = init

    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
    const headers = new Headers({ "Content-Type": "application/json" })
    const res = await subfetch(endpoint, { method: "POST", body, headers, signal, cache })

    if (!res.ok) {
      const error = new Error(`${await res.text()}`)
      return { error }
    }

    const response = await res.json() as Response<T>

    if (response.error) {
      const error = new Error(response.error.message)
      return { error }
    }

    const data = response.result
    return { data }
  }

}

export namespace Fetchers {

  export async function json<T>(input: RequestInfo | URL, init?: RequestInit, subfetch = globalThis.fetch) {
    const res = await subfetch(input, init)

    if (!res.ok) {
      const error = new Error(`${await res.text()}`)
      return { error }
    }

    const data = await res.json() as T
    return { data }
  }

}