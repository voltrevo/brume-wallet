import { XSWR } from "@hazae41/xswr"

export namespace RPC {

  export interface Request<T extends unknown[] = unknown[]> {
    readonly method: string,
    readonly params: T
  }

  export interface FullRequest<T extends unknown[] = unknown[]> {
    readonly jsonrpc: string,
    readonly id: number,
    readonly method: string,
    readonly params: T
  }

  /**
   * Transform a Request into a FullRequest
   * @param request 
   * @returns 
   */
  export function request<T extends unknown[] = unknown[]>(id: number, request: Request<T>): FullRequest<T> {
    const { method, params } = request

    return { jsonrpc: "2.0", id, method, params }
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
