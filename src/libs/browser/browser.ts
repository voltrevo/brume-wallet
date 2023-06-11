type Chrome = typeof chrome

declare module globalThis {
  const browser: Chrome
  const chrome: Chrome
}

export const browser = globalThis.browser ?? globalThis.chrome