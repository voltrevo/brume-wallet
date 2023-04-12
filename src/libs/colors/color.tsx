import { useMemo } from "react"
import { Hash } from "../hash/hash"

export namespace Colors {

  export const colors = [
    "purple-400", "yellow-400", "red-400",
    "blue-400", "orange-400", "green-400",
    "pink-400", "cyan-400", "amber-400",
    "lime-400", "emerald-400", "teal-400",
    "sky-400", "indigo-400", "violet-400",
    "fuchsia-400", "rose-400"
  ] as const

  export function from(seed: string) {
    return colors[Hash.from(seed, colors.length)]
  }

}

export function useColor(seed?: string) {
  return useMemo(() => {
    if (!seed) return "contrast"

    return Colors.from(seed)
  }, [seed])
}