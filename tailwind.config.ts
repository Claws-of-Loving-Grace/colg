import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F9F9F7",
        ink: "#111111",
        muted: "#E5E5E0",
        accent: "#CC0000",
      },
      fontFamily: {
        serif: ["Playfair Display", "Times New Roman", "serif"],
        body: ["Lora", "Georgia", "serif"],
        sans: ["Inter", "Helvetica Neue", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
    },
    borderRadius: {
      none: "0px",
      sm: "0px",
      DEFAULT: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "0px",
    },
  },
  plugins: [],
} satisfies Config;

export default config;
