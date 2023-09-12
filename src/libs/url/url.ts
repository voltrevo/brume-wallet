import { Optional } from "@hazae41/option"
import { Err, Ok } from "@hazae41/result"

export function qurl(pathname: string, query: Record<string, Optional<string>> = {}) {
  const url = new URL(pathname, "https://nowhere")

  for (const [key, value] of Object.entries(query))
    if (value != null)
      url.searchParams.append(key, value)

  return `${url.pathname}${url.search}`
}

export namespace Url {

  export function tryParse(url: string) {
    try {
      return new Ok(new URL(url))
    } catch (e: unknown) {
      return new Err(new Error(`Not an URL`))
    }
  }

}