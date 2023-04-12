import { Hash } from "../hash/hash"

export namespace ToColors {

  export const colors = [
    "to-red-400", "to-orange-400", "to-amber-400",
    "to-yellow-400", "to-lime-400", "to-green-400",
    "to-emerald-400", "to-teal-400", "to-cyan-400",
    "to-sky-400", "to-blue-400", "to-indigo-400",
    "to-violet-400", "to-purple-400", "to-fuchsia-400",
    "to-pink-400", "to-rose-400"
  ] as const

  export function get(index: number) {
    return colors[index % colors.length]
  }

  export function from(seed: string) {
    return colors[Hash.from(seed)]
  }

}

export function useToColor(index: number) {
  return ToColors.get(index)
}