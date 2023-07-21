import { Optional } from "@hazae41/option"
import { useMemo } from "react"

export namespace Modhash {

  export function from(seed: string, length = 256) {
    let index = 0

    for (let i = 0; i < seed.length; i++)
      index = (index + seed.charCodeAt(i)) % length

    return index
  }

}

export function useModhash(seed: string) {
  return useMemo(() => {
    return Modhash.from(seed)
  }, [seed])
}

export function useMaybeModhash(seed: Optional<string>) {
  return useMemo(() => {
    if (seed == null)
      return undefined
    return Modhash.from(seed)
  }, [seed])
}