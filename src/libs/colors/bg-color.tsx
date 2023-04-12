import { useMemo } from "react"
import { Hash } from "../hash/hash"

export namespace Colors {

  export const colors = [
    "bg-red-400", "bg-orange-400", "bg-amber-400",
    "bg-yellow-400", "bg-lime-400", "bg-green-400",
    "bg-emerald-400", "bg-teal-400", "bg-cyan-400",
    "bg-sky-400", "bg-blue-400", "bg-indigo-400",
    "bg-violet-400", "bg-purple-400", "bg-fuchsia-400",
    "bg-pink-400", "bg-rose-400"
  ] as const

  export function get(index: number) {
    return colors[index % colors.length]
  }

  export function from(seed: string) {
    return get(Hash.from(seed))
  }

}

export function useBgColor(index: number) {
  return Colors.get(index)
}

export function useBgColorHash(seed: string) {
  return useMemo(() => {
    return Colors.from(seed)
  }, [seed])
}

export function useTryBgColorHash(seed?: string) {
  return useMemo(() => {
    if (!seed) return "contrast"

    return Colors.from(seed)
  }, [seed])
}