import { Ok, Result } from "@hazae41/result"
import { tryBrowserSync } from "../browser/browser"

export type Port =
  | WebsitePort
  | ExtensionPort

export class WebsitePort {
  readonly uuid = crypto.randomUUID()

  constructor(
    readonly port: MessagePort
  ) { }

  trySend(message: unknown): Result<void, never> {
    return new Ok(this.port.postMessage(message))
  }

  onClose(listener: () => void) {
    // TODO
  }

}

export class ExtensionPort {
  readonly uuid = crypto.randomUUID()

  constructor(
    readonly port: chrome.runtime.Port
  ) { }

  trySend(message: unknown): Result<void, Error> {
    return tryBrowserSync(() => this.port.postMessage(message))
  }

  onClose(listener: () => void) {
    this.port.onDisconnect.addListener(listener)
  }

}