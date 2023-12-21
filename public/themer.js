const matcher = matchMedia("(prefers-color-scheme: dark)")

function apply() {
  if (matcher.matches)
    document.documentElement.classList.add("dark")
  else
    document.documentElement.classList.remove("dark")
}

matcher.addEventListener("change", () => apply())

apply()