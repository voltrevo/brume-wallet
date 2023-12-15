import { Err, Ok } from "@hazae41/result"

type Chrome = typeof chrome

declare module globalThis {
  const browser: Chrome
  const chrome: Chrome
}

export const browser = globalThis.browser ?? globalThis.chrome

export class BrowserError extends Error {
  readonly #class = BrowserError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new BrowserError(undefined, { cause })
  }

  static async runOrThrow<T>(callback: () => Promise<T>) {
    try {
      const result = await callback()

      if (browser.runtime.lastError)
        throw browser.runtime.lastError

      return result
    } catch (e: unknown) {
      throw BrowserError.from(e)
    }
  }

  static runOrThrowSync<T>(callback: () => T) {
    try {
      const result = callback()

      if (browser.runtime.lastError)
        throw browser.runtime.lastError

      return result
    } catch (e: unknown) {
      throw BrowserError.from(e)
    }
  }

  static async tryRun<T>(callback: () => Promise<T>) {
    try {
      const result = await callback()

      if (browser.runtime.lastError)
        throw browser.runtime.lastError

      return new Ok(result)
    } catch (e: unknown) {
      return new Err(BrowserError.from(e))
    }
  }

  static tryRunSync<T>(callback: () => T) {
    try {
      const result = callback()

      if (browser.runtime.lastError)
        throw browser.runtime.lastError

      return new Ok(result)
    } catch (e: unknown) {
      return new Err(BrowserError.from(e))
    }
  }

}