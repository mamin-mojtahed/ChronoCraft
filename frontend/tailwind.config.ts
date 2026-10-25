import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Metallic Copper / Rose-Gold from logo emblem
        copper: {
          50: "#FAF5F2",
          100: "#F5ECE8",
          200: "#EAD7CF",
          300: "#DCA48E", // Primary logo emblem color
          400: "#CF8D73",
          500: "#BD7458",
          600: "#A55C41",
          700: "#844731",
          800: "#653524",
          900: "#4D2619",
        },
        // Deep Slate-Teal from logo background
        brand: {
          50: "#F3F6F6",
          100: "#E3E9E9",
          200: "#C7D4D4",
          300: "#A4BABA",
          400: "#7A9999",
          500: "#557777",
          600: "#415E5E",
          700: "#324848",
          800: "#252F2F", // Logo background
          900: "#1A2121",
          950: "#111616",
        },
      },
    },
  },
  plugins: [],
};
export default config;
