/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      maxWidth: {
        app: '1600px',
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1168bd',
          600: '#0e559e',
          700: '#0b437c',
          900: '#0f2b48',
        },
        primary: {
          DEFAULT: '#1168bd',
          hover: '#0e5aa5',
          active: '#0b4782',
          dark: '#005096',
          container: '#1168bd',
          'on-container': '#dce8ff',
          fixed: '#d5e3ff',
          'fixed-dim': '#a6c8ff',
          on: '#ffffff',
          'on-fixed': '#001c3b',
          'on-fixed-variant': '#004787',
          inverse: '#a6c8ff',
        },
        secondary: {
          DEFAULT: '#0c2d48',
          light: '#44617e',
          container: '#c0ddff',
          'on-container': '#45617f',
          fixed: '#cfe4ff',
          'fixed-dim': '#acc9eb',
          on: '#ffffff',
          'on-fixed': '#001d34',
          'on-fixed-variant': '#2c4965',
        },
        tertiary: {
          DEFAULT: '#0ea5e9',
          dark: '#00557a',
          container: '#006e9e',
          'on-container': '#d2eaff',
          fixed: '#c9e6ff',
          'fixed-dim': '#89ceff',
          on: '#ffffff',
          'on-fixed': '#001e2f',
          'on-fixed-variant': '#004c6e',
        },
        surface: {
          DEFAULT: '#f8f9ff', // Base App Canvas
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          card: '#ffffff',
          container: '#e5eeff',
          'container-low': '#eff4ff',
          'container-lowest': '#ffffff',
          'container-high': '#dce9ff',
          'container-highest': '#d3e4fe',
          variant: '#d3e4fe',
          on: '#0b1c30',
          'on-variant': '#414752',
          inverse: '#213145',
          'inverse-on': '#eaf1ff',
          tint: '#005fb0',
        },
        background: '#f8f9ff',
        'on-background': '#0b1c30',
        outline: {
          DEFAULT: '#727783',
          variant: '#c1c6d4',
        },
        error: {
          DEFAULT: '#ba1a1a',
          hover: '#93000a',
          container: '#ffdad6',
          'on-container': '#93000a',
          on: '#ffffff',
        },
        success: {
          DEFAULT: '#10b981',
          container: '#d1fae5',
          text: '#065f46',
        },
        warning: {
          DEFAULT: '#f59e0b',
          container: '#fef3c7',
          text: '#92400e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-lg': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0em', fontWeight: '400' }],
        'label-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '600' }],
        'tabular-number': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em', fontWeight: '500' }],
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        gutter: '1.5rem',
        margin: '1.5rem',
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      zIndex: {
        base: '0',
        sticky: '20',
        dropdown: '40',
        popover: '50',
        modal: '60',
        drawer: '70',
        toast: '80',
      },
      boxShadow: {
        flat: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        popover: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        drawer: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.tabular-number': {
          'font-variant-numeric': 'tabular-nums',
          'font-feature-settings': '"tnum"',
        },
      });
    },
  ],
}
