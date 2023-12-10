import { Catched, Err, Ok, Result } from "@hazae41/result"

export async function tryFetchAsJson<T>(input: URL | RequestInfo, init?: RequestInit | undefined): Promise<Result<T, Error>> {
  try {
    const res = await fetch(input, init)

    if (!res.ok)
      return new Err(new Error(await res.text()))

    return new Ok(await res.json() as T)
  } catch (e: unknown) {
    return new Err(Catched.from(e))
  }
}

export async function tryFetchAsBlob(input: URL | RequestInfo, init?: RequestInit | undefined): Promise<Result<Blob, Error>> {
  try {
    const res = await fetch(input, init)

    if (!res.ok)
      return new Err(new Error(await res.text()))

    return new Ok(await res.blob())
  } catch (e: unknown) {
    return new Err(Catched.from(e))
  }
}