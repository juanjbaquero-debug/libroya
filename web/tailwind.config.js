/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f4efe6",
        paper: "#fffdf8",
        ink: "#1c1915",
        muted: "#6b645b",
        line: "#e4dcd0",
        terra: {
          DEFAULT: "#c45c26",
          dark: "#9a4318",
        },
      },
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino Linotype", "Palatino", "Georgia", "serif"],
        sans: ["Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 16px 40px -28px rgba(28, 25, 21, 0.45)",
      },
    },
  },
  plugins: [],
};
