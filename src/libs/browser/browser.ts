import { Pool } from "@hazae41/piscine"
import { Err, Ok, Result } from "@hazae41/result"

type Chrome = typeof chrome

declare module globalThis {
  const browser: Chrome
  const chrome: Chrome
}

export const browser = globalThis.browser ?? globalThis.chrome

export async function tryBrowser<T>(callback: () => Promise<T>) {
  try {
    const result = await callback()

    if (browser.runtime.lastError)
      return new Err(new BrowserError())

    return new Ok(result)
  } catch (e: unknown) {
    return new Err(new BrowserError())
  }
}

export function tryBrowserSync<T>(callback: () => T) {
  try {
    const result = callback()

    const error = browser.runtime.lastError

    if (error)
      return new Err(BrowserError.from(error))

    return new Ok(result)
  } catch (e: unknown) {
    return new Err(BrowserError.from(e))
  }
}

export class BrowserError extends Error {
  readonly #class = BrowserError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new BrowserError(undefined, { cause })
  }

}

export namespace Ports {

  export function tryPostMessage(port: chrome.runtime.Port, message: unknown): Result<void, BrowserError> {
    return tryBrowserSync(() => port.postMessage(message))
  }

  export async function tryGetAndPostMessage(ports: Pool<chrome.runtime.Port, Error>, message: unknown): Promise<Result<void, Error>> {
    return await ports.tryGet(0).then(r => r.andThenSync(port => tryPostMessage(port, message)))
  }

}