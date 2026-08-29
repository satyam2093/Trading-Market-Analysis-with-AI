/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        elevated: "hsl(var(--elevated))",
        border: "hsl(var(--border))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        bullish: "hsl(var(--bullish))",
        bearish: "hsl(var(--bearish))",
        warning: "hsl(var(--warning))",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.025em", fontWeight: "400" }],
        "display-lg": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "400" }],
        "display": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "400" }],
        "heading-xl": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "500" }],
        "heading-lg": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "500" }],
        "heading": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "500" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "caption": ["0.75rem", { lineHeight: "1.5", fontWeight: "500" }],
        "data": ["0.875rem", { lineHeight: "1.2", fontWeight: "600", fontFamily: "var(--font-geist-mono)" }],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      keyframes: {
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "ticker-scroll": "ticker-scroll 30s linear infinite",
      },
    },
  },
  plugins: [],
};
