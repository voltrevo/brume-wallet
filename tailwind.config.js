const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("hovered-or-clicked", ["&:active", "@media(hover: hover){&:hover}"])
      addVariant("clicked-or-focused", ["&:active", "&:focus"])
      addVariant("hovered-or-clicked-or-selected", ["&:active", "@media(hover: hover){&:hover}", "&[aria-selected=true]"])
    })
  ],
  safelist: [
    {
      pattern: /(text|bg|border|from|to)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(400)/,
      variants: ["hovered-or-clicked", "clicked-or-focused", "hovered-or-clicked-or-selected"],
    },
  ],
};