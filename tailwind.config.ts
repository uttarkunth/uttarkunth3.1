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
        // Uttarkunth Master Design System Tokens
        forest: {
          DEFAULT: "#263D32", // Primary brand green
          dark: "#1A2B23",
          light: "#345244",
          hover: "#1E3128",
          subtle: "#EBF0ED",
        },
        terracotta: {
          DEFAULT: "#C55B23", // Accent brand terracotta
          dark: "#A84C1C",
          hover: "#AB4E1D",
          light: "#FDF4EE",
          subtle: "#F5E4DA",
        },
        warm: {
          canvas: "#F5F0E6", // Warm page surfaces and editorial backgrounds
          card: "#FAF7F2",
          surface: "#FFFDF9",
        },
        beige: {
          DEFAULT: "#D9CCB8", // Borders, subtle panels and supporting surfaces
          light: "#E8DFD1",
          dark: "#C4B49D",
        },
        charcoal: {
          DEFAULT: "#29251F", // Main high-contrast body text
          dark: "#1A1713",
          muted: "#665E52",
          light: "#8C8273",
        },
        // Backward-compatible aliases for existing components
        ukorange: {
          DEFAULT: "#C55B23",
          hover: "#AB4E1D",
          light: "#FDF4EE",
        },
        ivory: {
          DEFAULT: "#FAF7F0",
          warm: "#F5F0E6",
          muted: "#D9CCB8",
        },
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Manrope'", "'Poppins'", "'Inter'", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(38, 61, 50, 0.08)',
        'lifted': '0 10px 25px -3px rgba(38, 61, 50, 0.10), 0 4px 6px -2px rgba(38, 61, 50, 0.05)',
        'warm': '0 4px 20px -2px rgba(197, 91, 35, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
