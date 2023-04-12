import { useMemo } from "react"

export namespace Hash {

  export function from(seed: string, length = 256) {
    let index = 0

    for (let i = 0; i < seed.length; i++)
      index = (index + seed.charCodeAt(i)) % length

    return index
  }

}

export function useHash(seed: string, length?: number) {
  return useMemo(() => {
    return Hash.from(seed, length)
  }, [seed, length])
}