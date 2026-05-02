import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream:       "var(--color-cream)",
        "warm-white":"var(--color-warm-white)",
        charcoal:    "var(--color-charcoal)",
        brown:       "var(--color-brown)",
        sage:        "var(--color-sage)",
        sand:        "var(--color-sand)",
        border:      "var(--color-border)",
        error:       "var(--color-error)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body:    ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
