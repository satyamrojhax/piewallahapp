import type { Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss";

const typography = require("@tailwindcss/typography") as PluginAPI;

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-hero': 'var(--gradient-hero)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'card': 'var(--shadow-card)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pageFadeIn": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slideInFromLeft": {
          "0%": {
            opacity: "0",
            transform: "translateX(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "slideInFromRight": {
          "0%": {
            opacity: "0",
            transform: "translateX(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "slideInFromBottom": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slideInFromTop": {
          "0%": {
            opacity: "0",
            transform: "translateY(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slideOutToLeft": {
          "0%": {
            opacity: "1",
            transform: "translateX(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateX(-20px)",
          },
        },
        "slideOutToRight": {
          "0%": {
            opacity: "1",
            transform: "translateX(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateX(20px)",
          },
        },
        "slideOutToTop": {
          "0%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(-20px)",
          },
        },
        "slideOutToBottom": {
          "0%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
        },
        "bounce": {
          "0%, 20%, 53%, 80%, 100%": {
            animationTimingFunction: "cubic-bezier(0.215, 0.610, 0.355, 1.000)",
            transform: "translate3d(0, 0, 0)",
          },
          "40%, 43%": {
            animationTimingFunction: "cubic-bezier(0.755, 0.050, 0.855, 0.060)",
            transform: "translate3d(0, -30px, 0)",
          },
          "70%": {
            animationTimingFunction: "cubic-bezier(0.755, 0.050, 0.855, 0.060)",
            transform: "translate3d(0, -15px, 0)",
          },
          "90%": {
            transform: "translate3d(0, -4px, 0)",
          },
        },
        "pulse": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
        "shimmer": {
          "0%": {
            backgroundPosition: "-200px 0",
          },
          "100%": {
            backgroundPosition: "calc(200px + 100%) 0",
          },
        },
        "spin": {
          "from": {
            transform: "rotate(0deg)",
          },
          "to": {
            transform: "rotate(360deg)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pageFadeIn": "pageFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideInFromLeft": "slideInFromLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideInFromRight": "slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideInFromBottom": "slideInFromBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideInFromTop": "slideInFromTop 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideOutToLeft": "slideOutToLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideOutToRight": "slideOutToRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideOutToTop": "slideOutToTop 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slideOutToBottom": "slideOutToBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce": "bounce 1s infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "spin": "spin 1s linear infinite",
      },
      transitionTimingFunction: {
        "ease-out-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-in-smooth": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      transitionDuration: {
        "fast": "150ms",
        "normal": "300ms",
        "slow": "500ms",
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '20': '5rem',
        '24': '6rem',
      },
      maxWidth: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
      },
    },
  },
  plugins: [typography, require("tailwindcss-animate")],
} satisfies Config;
