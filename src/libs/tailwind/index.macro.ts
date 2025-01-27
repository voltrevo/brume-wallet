import { Color } from "../colors/colors"

declare function $run$<T>(callback: () => T): T

export const safelist = $run$(() => {
  const classes = [
    (color: string) => `text-${color}-400`,
    (color: string) => `dark:text-${color}-500`,
    (color: string) => `bg-${color}-400`,
    (color: string) => `dark:bg-${color}-500`,
    (color: string) => `enabled:hover:bg-${color}-400/90`,
    (color: string) => `dark:enabled:hover:bg-${color}-500/90`,
    (color: string) => `focus-visible:outline-${color}-400`,
    (color: string) => `dark:focus-visible:outline-${color}-500`,
  ]

  return Color.all.flatMap(color => classes.map(f => f(color)))
})