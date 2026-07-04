import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1c2a24",
        paper: "#f6f4ee",
        moss: "#31503f",
        mossdark: "#1f3529",
        clay: "#b5623a",
        wheat: "#e4dcc4",
        line: "#d8d2bf",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Work Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        sm: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
