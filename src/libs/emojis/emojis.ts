export namespace Emojis {

  export const all = [
    "☁️", "☀️", "🌪️", "🔥"
  ] as const

  export function mod(index: number) {
    return index % all.length
  }

  export function get(index: number) {
    return all[mod(index)]
  }

}