const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("hovered-or-active", ["&:active", "@media(hover: hover){&:hover}"])
      addVariant("hovered-or-active-or-selected", ["&:active", "@media(hover: hover){&:hover}", "&[aria-selected=true]"])
    })
  ],
  safelist: [
    {
      pattern: /(text|bg|border|from|to)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(400)/,
      variants: ["hovered-or-active", "hovered-or-active-or-selected"],
    },
  ],
};