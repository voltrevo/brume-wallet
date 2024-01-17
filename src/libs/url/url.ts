import { Nullable } from "@hazae41/option"

export function qurl(pathname: string, query: Record<string, Nullable<any>> = {}) {
  const url = new URL(pathname, "https://nowhere")

  for (const [key, value] of Object.entries(query))
    if (value != null)
      url.searchParams.append(key, String(value))

  return `${url.pathname}${url.search}${url.hash}`
}
