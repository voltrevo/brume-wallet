import { Optional } from "@hazae41/option"

export function qurl(pathname: string, query: Record<string, Optional<string>> = {}) {
  const url = new URL(pathname, "https://nowhere")

  for (const [key, value] of Object.entries(query))
    if (value != null)
      url.searchParams.append(key, value)

  return `${url.pathname}${url.search}`
}