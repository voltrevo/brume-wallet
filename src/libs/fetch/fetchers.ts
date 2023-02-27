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