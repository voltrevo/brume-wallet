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

export namespace Gradients {

  const all = [
    ["red-400", "red-400"],
    ["orange-400", "amber-400"],
    ["amber-400", "yellow-400"],
    ["yellow-400", "yellow-400"],
    ["lime-400", "lime-400"],
    ["green-400", "emerald-400"],
    ["emerald-400", "teal-400"],
    ["teal-400", "cyan-400"],
    ["cyan-400", "sky-400"],
    ["sky-400", "blue-400"],
    ["blue-400", "indigo-400"],
    ["indigo-400", "violet-400"],
    ["violet-400", "purple-400"],
    ["purple-400", "fuchsia-400"],
    ["fuchsia-400", "pink-400"],
    ["pink-400", "rose-400"],
    ["rose-400", "red-400"]
  ]

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