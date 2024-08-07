import { Nullable } from "@hazae41/option"

export function urlOf(pathOrUrl: string | URL, search: Record<string, Nullable<any>> = {}) {
  const url = new URL(pathOrUrl, location.href)
  const entries = Object.entries(search).filter(([_, v]) => v != null)
  url.search = new URLSearchParams(entries).toString()
  return url
}

export function pathOf(pathOrUrl: string | URL) {
  const url = new URL(pathOrUrl, location.href)
  return url.pathname + url.search + url.hash
}
