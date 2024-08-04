import { Nullable } from "@hazae41/option"

export function pathOf(pathOrUrl: string | URL) {
  const url = new URL(pathOrUrl, location.href)
  return url.pathname + url.search + url.hash
}

export function qurl(pathOrUrl: string | URL, query: Record<string, Nullable<any>> = {}) {
  const url = new URL(pathOrUrl, location.href)

  for (const [key, value] of Object.entries(query))
    if (value != null)
      url.searchParams.append(key, String(value))

  return url
}
