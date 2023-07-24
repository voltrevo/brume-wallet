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
      addVariant("clicked-or-focused", ["&:active", "&:focus-visible"])
      addVariant("hovered-or-clicked-or-focused", ["&:active", "&:focus-visible", "@media(hover: hover){&:hover}"])
      addVariant("hovered-or-clicked-or-focused-or-selected", ["&:active", "&:focus-visible", "@media(hover: hover){&:hover}", "&[aria-selected=true]"])
    })
  ],
  safelist: [
    {
      pattern: /(text|bg|border|from|to)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(400)/,
      variants: ["clicked-or-focused", "hovered-or-clicked-or-focused", "hovered-or-clicked-or-focused-or-selected"],
    },
  ],
};