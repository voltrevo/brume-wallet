export namespace Colors {

  export const all = [
    "red-400", "orange-400", "amber-400",
    "yellow-400", "lime-400", "green-400",
    "emerald-400", "teal-400", "cyan-400",
    "sky-400", "blue-400", "indigo-400",
    "violet-400", "purple-400", "fuchsia-400",
    "pink-400", "rose-400"
  ] as const

  export function mod(index: number) {
    return index % all.length
  }

  export function get(index: number) {
    return all[mod(index)]
  }

}