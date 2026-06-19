import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {
    colors: { ink: "#070b12", panel: "#0d1420", line: "#1c2939", mint: "#37e2a4", cyan: "#3cc7f5" },
    boxShadow: { glow: "0 0 30px rgba(55,226,164,.08)" }
  }},
  plugins: []
} satisfies Config;
