import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary orange color for CTAs
        primary: {
          DEFAULT: '#FF6B00',
          hover: '#E66000',
          light: '#FF8533',
          dark: '#CC5500',
        },
        // Background and surface colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Card colors
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Popover colors
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Muted colors
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        // Accent colors
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        // Destructive colors
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // Border colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      // Custom font family for Onest
      fontFamily: {
        sans: ['var(--font-onest)', 'system-ui', 'sans-serif'],
      },
      // Border radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Minimum touch target size for outdoor use
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
}

export default config
