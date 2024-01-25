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
  safelist: [
    {
      pattern: /(text|bg|border|outline|from|to)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(400|500)(\/90)?/,
      variants: ["dark", "enabled:hover", "dark:enabled:hover", "focus-visible", "dark:focus-visible"]
    },
  ],
};