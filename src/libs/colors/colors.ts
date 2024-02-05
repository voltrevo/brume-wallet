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

export namespace Gradient {

  const all = {
    "red": "red",
    "orange": "amber",
    "amber": "yellow",
    "yellow": "yellow",
    "lime": "lime",
    "green": "emerald",
    "emerald": "teal",
    "teal": "cyan",
    "cyan": "sky",
    "sky": "blue",
    "blue": "indigo",
    "indigo": "violet",
    "violet": "purple",
    "purple": "fuchsia",
    "fuchsia": "pink",
    "pink": "rose",
    "rose": "red"
  }

  export function get(color: Color) {
    return [color, all[color]]
  }

}