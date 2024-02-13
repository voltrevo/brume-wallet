export type Color = typeof Color.all[number]

export namespace Color {

  export const all = [
    "red", "orange", "amber",
    "yellow", "lime", "green",
    "emerald", "teal", "cyan",
    "sky", "blue", "indigo",
    "violet", "purple", "fuchsia",
    "pink", "rose"
  ] as const

  export function mod(index: number) {
    return index % all.length
  }

  export function get(index: number) {
    return all[mod(index)]
  }

}