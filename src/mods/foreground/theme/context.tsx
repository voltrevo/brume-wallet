
import { useObjectMemo } from "@/libs/react/memo"
import { ChildrenProps } from "@/libs/react/props/children"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type Theme =
  | "light"
  | "dark"

export interface ThemeHandle {
  stored?: Theme
  browser?: Theme
  current?: Theme
  set(theme?: Theme): void
}

export const ThemeContext =
  createContext<ThemeHandle | undefined>(undefined)

export function useTheme() {
  return useContext(ThemeContext)!
}

export function ThemeProvider(props: ChildrenProps) {
  const [stored, setStored] = useState<Theme>()

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme")

      if (stored === "light")
        setStored("light")
      if (stored === "dark")
        setStored("dark")
    } catch (e: unknown) { }
  }, [])

  const set = useCallback((theme?: Theme) => {
    if (theme != null)
      localStorage.setItem("theme", theme)
    else
      localStorage.removeItem("theme")
    setStored(theme)
  }, [])

  const [browser, setBrowser] = useState<Theme>()

  useEffect(() => {
    const matcher = matchMedia('(prefers-color-scheme: dark)')
    const f = () => setBrowser(matcher?.matches ? "dark" : "light")

    f()

    matcher.addEventListener("change", f)
    return () => matcher.removeEventListener("change", f)
  }, [])

  const current = stored ?? browser

  useEffect(() => {
    const color = document.querySelector("meta[name=theme-color]")!

    if (current === "dark") {
      document.documentElement.classList.add("dark")
      color.setAttribute("content", "#000000")
    } else {
      document.documentElement.classList.remove("dark")
      color.setAttribute("content", "#ffffff")
    }
  }, [current])

  const handle = useObjectMemo({ stored, browser, current, set })

  return <ThemeContext.Provider value={handle}>
    {props.children}
  </ThemeContext.Provider>
}