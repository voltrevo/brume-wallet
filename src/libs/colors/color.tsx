export namespace Colors {

  export const colors = [
    "bg-purple-400", "bg-yellow-400", "bg-red-400",
    "bg-blue-400", "bg-orange-400", "bg-green-400",
    "bg-pink-400", "bg-cyan-400", "bg-amber-400",
    "bg-lime-400", "bg-emerald-400", "bg-teal-400",
    "bg-sky-400", "bg-indigo-400", "bg-violet-400",
    "bg-fuchsia-400", "bg-rose-400"
  ] as const

  export function from(seed: string) {
    let index = 0

    for (let i = 0; i < seed.length; i++)
      index = (index + seed.charCodeAt(i)) % colors.length

    return colors[index]
  }

}