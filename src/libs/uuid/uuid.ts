export function randomUUID() {
  if (!isSecureContext) {
    const parts = new Array<string>()

    {
      const bytes = new Uint8Array(4)
      crypto.getRandomValues(bytes)

      parts.push(bytes.reduce((p, c) => p + c.toString(16).padStart(2, "0"), ""))
    }

    {
      const bytes = new Uint8Array(2)
      crypto.getRandomValues(bytes)

      parts.push(bytes.reduce((p, c) => p + c.toString(16).padStart(2, "0"), ""))
    }

    {
      const bytes = new Uint8Array(2)
      crypto.getRandomValues(bytes)

      parts.push(bytes.reduce((p, c) => p + c.toString(16).padStart(2, "0"), ""))
    }

    {
      const bytes = new Uint8Array(2)
      crypto.getRandomValues(bytes)

      parts.push(bytes.reduce((p, c) => p + c.toString(16).padStart(2, "0"), ""))
    }

    {
      const bytes = new Uint8Array(6)
      crypto.getRandomValues(bytes)

      parts.push(bytes.reduce((p, c) => p + c.toString(16).padStart(2, "0"), ""))
    }

    return parts.join("-")
  }

  return crypto.randomUUID()
}