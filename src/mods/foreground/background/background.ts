import { browser } from "@/libs/browser/browser"

export type Background =
  | WebsiteBackground
  | ExtensionBackground

export class WebsiteBackground {
  readonly channel = new BroadcastChannel("foreground")

  isWebsite(): this is WebsiteBackground {
    return true
  }

  isExtension(): false {
    return false
  }

  postMessage(message: unknown) {
    this.channel.postMessage(message)
  }

  onMessage(listener: (message: unknown) => void) {
    this.channel.addEventListener("message", e => listener(e.data))
  }

}

export class ExtensionBackground {
  readonly port = browser.runtime.connect({ name: "foreground" })

  isWebsite(): false {
    return false
  }

  isExtension(): this is ExtensionBackground {
    return true
  }

  postMessage(message: unknown) {
    this.port.postMessage(message)
  }

  onMessage(listener: (message: unknown) => void) {
    this.port.onMessage.addListener(listener)
  }

}