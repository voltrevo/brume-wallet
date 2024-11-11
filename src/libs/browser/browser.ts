import { Nullable } from "@hazae41/option"

type Chrome = typeof chrome

declare namespace globalThis {
  const browser: Nullable<Chrome>
  const chrome: Nullable<Chrome>
}

export const browser = false || globalThis.browser || globalThis.chrome

export class BrowserError extends Error {
  readonly #class = BrowserError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new BrowserError(undefined, { cause })
  }

  static #connect(connectInfo?: chrome.runtime.ConnectInfo) {
    const port = browser!.runtime.connect(connectInfo)
    port.onDisconnect.addListener(() => void chrome.runtime.lastError)
    return port
  }

  static connectOrThrow(connectInfo?: chrome.runtime.ConnectInfo) {
    return this.runOrThrowSync(() => this.#connect(connectInfo))
  }

  static async runOrThrow<T>(callback: () => Promise<T>) {
    try {
      const result = await callback()

      if (browser!.runtime.lastError)
        throw browser!.runtime.lastError

      return result
    } catch (e: unknown) {
      throw BrowserError.from(e)
    }
  }

  static runOrThrowSync<T>(callback: () => T) {
    try {
      const result = callback()

      if (browser!.runtime.lastError)
        throw browser!.runtime.lastError

      return result
    } catch (e: unknown) {
      throw BrowserError.from(e)
    }
  }

}