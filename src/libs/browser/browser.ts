declare module globalThis {
  const browser: typeof chrome | undefined
}

export const browser = globalThis.browser ?? chrome