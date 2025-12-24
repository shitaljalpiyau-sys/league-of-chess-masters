import type { Config } from "tailwindcss";

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
          glow: "hsl(var(--primary-glow))",
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
          dark: "hsl(var(--card-dark))",
          darker: "hsl(var(--card-darker))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: {
          DEFAULT: "hsl(var(--premium-gold))",
          light: "hsl(var(--premium-gold-light))",
          dark: "hsl(var(--premium-gold-dark))",
        },
        emerald: {
          dark: "hsl(160, 30%, 6%)",
          deep: "hsl(160, 35%, 4%)",
          rich: "hsl(160, 45%, 22%)",
          glow: "hsl(160, 55%, 30%)",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
        section: {
          1: "hsl(var(--section-1))",
          2: "hsl(var(--section-2))",
          3: "hsl(var(--section-3))",
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, hsl(160, 45%, 22%) 0%, hsl(160, 55%, 30%) 100%)',
        'gradient-gold': 'linear-gradient(135deg, hsl(45, 85%, 55%) 0%, hsl(40, 80%, 45%) 100%)',
        'gradient-luxury': 'linear-gradient(180deg, hsl(160, 30%, 6%) 0%, hsl(160, 35%, 3%) 100%)',
        'gradient-card': 'linear-gradient(180deg, hsl(160, 25%, 9%) 0%, hsl(160, 28%, 5%) 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'gold': '0 0 25px hsla(45, 85%, 55%, 0.2)',
        'gold-lg': '0 0 40px hsla(45, 85%, 55%, 0.3)',
        'emerald': '0 0 30px hsla(160, 45%, 22%, 0.3)',
        'emerald-lg': '0 0 50px hsla(160, 45%, 22%, 0.4)',
        'elegant': '0 25px 50px -12px hsla(160, 30%, 4%, 0.5)',
      },
      animation: {
        'gradient': 'gradient-shift 8s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'neon-pulse': 'neon-pulse 4s ease-in-out infinite',
        'trophy-glow': 'trophy-glow 2s ease-in-out infinite',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 20px hsla(45, 85%, 55%, 0.2)" },
          "50%": { boxShadow: "0 0 40px hsla(45, 85%, 55%, 0.4)" },
        },
        "shimmer": {
          "0%, 100%": { backgroundPosition: "-200% 0" },
          "50%": { backgroundPosition: "200% 0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "neon-pulse": {
          "0%, 100%": { borderColor: "hsla(160, 45%, 25%, 0.4)", boxShadow: "0 0 10px hsla(160, 45%, 25%, 0.3)" },
          "50%": { borderColor: "hsla(45, 85%, 55%, 0.5)", boxShadow: "0 0 20px hsla(45, 85%, 55%, 0.3)" },
        },
        "trophy-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px hsla(45, 85%, 55%, 0.4))" },
          "50%": { filter: "drop-shadow(0 0 16px hsla(45, 85%, 55%, 0.7))" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
