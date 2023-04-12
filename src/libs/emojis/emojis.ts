export namespace Emojis {

  export const all = [
    "☁️", "☀️", "🌪️", "🔥"
  ] as const

  export function get(index: number) {
    return all[index % all.length]
  }

}