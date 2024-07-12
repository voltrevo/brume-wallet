export async function fetchAsJsonOrThrow<T>(input: URL | RequestInfo, init?: RequestInit | undefined): Promise<T> {
  const res = await fetch(input, init)

  if (!res.ok)
    throw new Error(await res.text())

  return await res.json() as T
}

export async function fetchAsBlobOrThrow(input: URL | RequestInfo, init?: RequestInit | undefined): Promise<Blob> {
  const res = await fetch(input, init)

  if (!res.ok)
    throw new Error(await res.text())

  return await res.blob()
}