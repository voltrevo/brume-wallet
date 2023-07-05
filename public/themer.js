const matcher = matchMedia("(prefers-color-scheme: dark)")
const color = document.querySelector("meta[name=theme-color]")

function setTheme(theme) {
  const browser = matcher.matches
    ? "dark"
    : "white"

  const current = theme
    ? theme
    : browser

  if (current === "dark") {
    document.documentElement.classList.add("dark")
    color.setAttribute("content", "#000000")
  }

  if (current === "light") {
    document.documentElement.classList.remove("dark")
    color.setAttribute("content", "#ffffff")
  }
}

function loadTheme() {
  const value = localStorage.getItem("theme")

  if (value === "dark")
    setTheme("dark")

  if (value === "light")
    setTheme("light")
}

loadTheme()