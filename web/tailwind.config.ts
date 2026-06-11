import type { Config } from 'tailwindcss';

/**
 * Escalas do Monte Carmelo Design System.
 * `slate` e `gray` são remapeadas para a escala cinza da marca, com os tons
 * 50/100 apontando para paper/paper-deep — assim superfícies e hovers
 * existentes herdam o fundo "papel quente" do sistema sem churn de classes.
 */
const brandGray = {
  50: '#FAF6EF', // paper
  100: '#F2EBDD', // paper-deep
  200: '#D6D7D9',
  300: '#B5B7B9',
  400: '#8C8E91',
  500: '#63666A', // cor secundária oficial do manual
  600: '#4E5054',
  700: '#3A3C3F',
  800: '#26282A',
  900: '#14161A',
  950: '#0C0D10',
};

const brandTeal = {
  50: '#E6F6F5',
  100: '#B8E5E1',
  200: '#8AD4CD',
  300: '#5BC2BA',
  400: '#2DB1A6',
  500: '#00A499', // cor primária oficial do manual (Pantone 3272)
  600: '#008F85',
  700: '#007268',
  800: '#00554F',
  900: '#003834',
  950: '#002420',
};

/**
 * Escalas semânticas derivadas dos tokens do DS (danger/success/warn) —
 * substituem os tons neon padrão do Tailwind pela paleta morna da marca.
 */
const brandRed = {
  50: '#FBEFED',
  100: '#FAE5E2', // danger-soft
  200: '#F3CCC7',
  300: '#E5A8A1',
  400: '#D17A72',
  500: '#C25B55',
  600: '#B5453F', // danger
  700: '#9A3A35',
  800: '#7E302C',
  900: '#672724',
};

const brandGreen = {
  50: '#EDF5F0',
  100: '#E1F0E8', // success-soft
  200: '#C5E0D2',
  300: '#9CC8B1',
  400: '#67A888',
  500: '#3B8E6A',
  600: '#2E7D5B', // success
  700: '#286D50',
  800: '#1F5740',
  900: '#1A4936',
};

const brandAmber = {
  50: '#FCF5E8',
  100: '#FAF0DC', // warn-soft
  200: '#F0DCB8',
  300: '#E4C389',
  400: '#D8AC5F',
  500: '#D49A3F',
  600: '#C68A2E', // warn
  700: '#A8741F',
  800: '#8C6018', // warn-fg
  900: '#5E4015',
};

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: brandTeal,
        slate: brandGray,
        gray: brandGray,
        red: brandRed,
        green: brandGreen,
        amber: brandAmber,
        yellow: brandAmber,
        orange: brandAmber,
        brand: {
          DEFAULT: '#00A499',
          hover: '#008F85',
          press: '#007268',
          soft: '#E6F6F5',
          'soft-fg': '#007268',
          deep: '#1F4A45',
        },
        paper: {
          DEFAULT: '#FAF6EF',
          deep: '#F2EBDD',
        },
        sand: '#F1E7D2',
        clay: '#C8896B',
        forest: '#1F4A45',
        sage: '#9CB7A4',
        success: { DEFAULT: '#2E7D5B', soft: '#E1F0E8' },
        warn: { DEFAULT: '#C68A2E', soft: '#FAF0DC', fg: '#8C6018' },
        danger: { DEFAULT: '#B5453F', soft: '#FAE5E2' },
        info: { DEFAULT: '#007268', soft: '#E6F6F5' },
        'text-dark': '#3A3C3F',
        'text-light': '#8C8E91',
        surface: '#FFFFFF',
        divider: 'rgba(99, 102, 106, 0.10)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        /* border/input carregam alfa no próprio token — sem <alpha-value> */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)', // 10px — inputs, cards pequenos
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        card: '14px', // cards padrão
        hero: '20px', // cards de destaque
        sheet: '24px', // modais e sheets
      },
      boxShadow: {
        sm: 'var(--shadow-1)',
        DEFAULT: 'var(--shadow-2)',
        md: 'var(--shadow-2)',
        lg: 'var(--shadow-3)',
        xl: 'var(--shadow-4)',
        '2xl': 'var(--shadow-4)',
        brand: 'var(--shadow-brand)',
        'inset-border': 'inset 0 0 0 1px var(--border-token)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.2, 0.7, 0.25, 1)',
        'in-out-soft': 'cubic-bezier(0.5, 0, 0.25, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '220ms',
        slow: '360ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
