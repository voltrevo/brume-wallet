import { Result } from "@hazae41/result"

export async function tryFetchAsJson<T>(input: URL | RequestInfo, init?: RequestInit | undefined): Promise<Result<T, Error>> {
  return Result.runAndDoubleWrap(() => fetchAsJsonOrThrow(input, init))
}

export async function fetchAsJsonOrThrow<T>(input: URL | RequestInfo, init?: RequestInit | undefined): Promise<T> {
  const res = await fetch(input, init)

  if (!res.ok)
    throw new Error(await res.text())

  return await res.json() as T
}

export async function tryFetchAsBlob(input: URL | RequestInfo, init?: RequestInit | undefined): Promise<Result<Blob, Error>> {
  return Result.runAndDoubleWrap(() => fetchAsBlobOrThrow(input, init))
}

export async function fetchAsBlobOrThrow(input: URL | RequestInfo, init?: RequestInit | undefined): Promise<Blob> {
  const res = await fetch(input, init)

  if (!res.ok)
    throw new Error(await res.text())

  return await res.blob()
}