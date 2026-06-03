import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FBF4EE",
          100: "#F5E6D8",
          400: "#C07848",
          500: "#A86030",
          600: "#8C4A1E",
          700: "#763D18",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
