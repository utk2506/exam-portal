import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fff8ef",
        ink: "#1d1c1a",
        primary: "#0f766e",
        accent: "#ea580c",
        danger: "#be123c",
        success: "#0f766e",
        muted: "#6b665e"
      },
      boxShadow: {
        card: "0 20px 50px rgba(15, 23, 42, 0.12)"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["Segoe UI", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
