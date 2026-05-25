import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem"
      }
    },
    extend: {
      fontFamily: {
        sans: ["Nunito", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"]
      },
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          soft: "rgb(var(--color-surface-soft) / <alpha-value>)",
          elevated: "rgb(var(--color-surface-elevated) / <alpha-value>)"
        },
        border: "rgb(var(--color-border) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
          soft: "rgb(var(--color-primary-soft) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          foreground: "rgb(var(--color-accent-foreground) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)"
        },
        charcoal: "rgb(var(--color-charcoal) / <alpha-value>)",
        coral: {
          DEFAULT: "rgb(var(--color-coral) / <alpha-value>)",
          foreground: "rgb(var(--color-coral-foreground) / <alpha-value>)",
          soft: "rgb(var(--color-coral-soft) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)"
        },
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "999px"
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)"
      },
      backgroundImage: {
        "hero-radial": "radial-gradient(circle at top left, rgba(var(--color-accent) / 0.18), transparent 40%), radial-gradient(circle at bottom right, rgba(var(--color-primary) / 0.16), transparent 45%)",
        "mesh-warm": "linear-gradient(135deg, rgba(var(--color-accent) / 0.12), transparent 35%), linear-gradient(225deg, rgba(var(--color-coral) / 0.12), transparent 40%), linear-gradient(315deg, rgba(var(--color-primary) / 0.16), transparent 55%)"
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        "fade-up": {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        "fade-up": 'fade-up 0.5s ease-out'
      }
    }
  },
  plugins: []
};

export default config;
