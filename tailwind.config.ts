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
        forest: {
          DEFAULT: "#13612E",
          dark: "#0D2117",
          light: "#1C783D",
          hover: "#0F5025",
          subtle: "#EBF2E3"
        },
        ukblue: {
          DEFAULT: "#3182CE",
          deep: "#2B6CB0",
          light: "#EBF8FF"
        },
        ukorange: {
          DEFAULT: "#C85A20",
          hover: "#A94817",
          light: "#FDF2EB"
        },
        ivory: {
          DEFAULT: "#FAF7F0",
          warm: "#F5F0E6",
          muted: "#EADDC7"
        },
        charcoal: {
          DEFAULT: "#29251F",
          dark: "#1D1B17",
          muted: "#5A544A"
        }
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Poppins'", "'Inter'", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(19, 97, 46, 0.08)',
        'lifted': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
};
export default config;
