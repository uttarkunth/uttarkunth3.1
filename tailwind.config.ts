import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1360px",
      },
    },
    extend: {
      colors: {
        // Uttarkunth Master Design System Tokens — Himalayan Editorial
        forest: {
          DEFAULT: "#263D32", // Primary brand green
          dark: "#1A2B23",    // Deep pine editorial dark surface
          light: "#345244",   // Elevated pine accent
          hover: "#1E3128",   // Interactive hover state
          subtle: "#EBF0ED",  // Quiet sage tint
          muted: "#4A6659",   // Secondary forest tone
        },
        terracotta: {
          DEFAULT: "#C55B23", // Accent brand terracotta
          dark: "#A84C1C",
          hover: "#AB4E1D",
          light: "#FDF4EE",
          subtle: "#F5E4DA",
        },
        warm: {
          canvas: "#F5F0E6",  // Warm page surfaces and editorial backgrounds
          card: "#FAF7F2",    // Secondary warm card surface
          surface: "#FFFDF9", // Elevated paper surface
        },
        beige: {
          DEFAULT: "#D9CCB8", // Borders, subtle panels and supporting surfaces
          light: "#E8DFD1",   // Hairline divider tone
          dark: "#C4B49D",    // Emphasized border tone
        },
        charcoal: {
          DEFAULT: "#29251F", // Main high-contrast body text
          dark: "#1A1713",    // Deep ink display text
          muted: "#665E52",   // Secondary body & caption text
          light: "#8C8273",   // Quiet metadata & placeholder text
        },
        // Semantic status tokens harmonized with the Himalayan palette
        status: {
          success: "#1F5E3B",
          "success-bg": "#EDF5F0",
          warning: "#9A5B13",
          "warning-bg": "#FDF6EC",
          danger: "#A63228",
          "danger-bg": "#FDF2F1",
          info: "#1E3A5F",
          "info-bg": "#EFF4FA",
        },
        // Backward-compatible aliases for existing components
        ukorange: {
          DEFAULT: "#C55B23",
          deep: "#A84C1C",
          hover: "#AB4E1D",
          light: "#FDF4EE",
        },
        "ukblue-deep": {
          DEFAULT: "#1E3A5F",
          light: "#EFF4FA",
        },
        ivory: {
          DEFAULT: "#FAF7F0",
          warm: "#F5F0E6",
          muted: "#D9CCB8",
        },
        canvas: "#F5F0E6",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "Cambria", "serif"],
        sans: ["'Manrope'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        "display-2xl": ["clamp(2.75rem, 5.5vw, 4.75rem)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "display-xl": ["clamp(2.25rem, 4.5vw, 3.75rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        "display-lg": ["clamp(1.875rem, 3.5vw, 3rem)", { lineHeight: "1.12", letterSpacing: "-0.01em" }],
        "display-md": ["clamp(1.5rem, 2.5vw, 2.25rem)", { lineHeight: "1.18", letterSpacing: "-0.01em" }],
        "display-sm": ["clamp(1.25rem, 2vw, 1.75rem)", { lineHeight: "1.24" }],
        "editorial-kicker": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.16em" }],
      },
      maxWidth: {
        "editorial-narrow": "42rem", // 672px optimal reading measure
        "editorial": "64rem",        // 1024px editorial container
        "ecosystem": "80rem",        // 1280px primary layout container
        "wide": "88rem",             // 1408px wide gallery container
      },
      borderRadius: {
        "editorial-sm": "0.5rem",    // 8px
        "editorial": "0.75rem",      // 12px
        "editorial-lg": "1rem",      // 16px
        "editorial-xl": "1.25rem",   // 20px
        "editorial-2xl": "1.5rem",   // 24px
      },
      boxShadow: {
        "xs": "0 1px 2px 0 rgba(38, 61, 50, 0.04)",
        "soft": "0 4px 20px -2px rgba(38, 61, 50, 0.07), 0 1px 3px -1px rgba(38, 61, 50, 0.04)",
        "lifted": "0 12px 28px -4px rgba(38, 61, 50, 0.10), 0 4px 8px -2px rgba(38, 61, 50, 0.05)",
        "elevated": "0 20px 40px -8px rgba(26, 43, 35, 0.14), 0 8px 16px -4px rgba(26, 43, 35, 0.06)",
        "warm": "0 6px 22px -2px rgba(197, 91, 35, 0.14)",
        "inner-hairline": "inset 0 0 0 1px rgba(217, 204, 184, 0.6)",
      },
      transitionTimingFunction: {
        "editorial": "cubic-bezier(0.16, 1, 0.3, 1)",
        "editorial-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
        "gentle": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      transitionDuration: {
        "180": "180ms",
        "250": "250ms",
        "400": "400ms",
        "600": "600ms",
      },
      zIndex: {
        "header": "40",
        "subnav": "30",
        "dropdown": "50",
        "drawer": "60",
        "modal": "70",
        "toast": "80",
        "splash": "100",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "drawer-down": {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-up": "fade-up 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "drawer-down": "drawer-down 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;

