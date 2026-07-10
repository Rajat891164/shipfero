/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        background:    "rgb(var(--background) / <alpha-value>)",
        surface:       "rgb(var(--surface) / <alpha-value>)",
        "surface-light": "rgb(var(--surface-light) / <alpha-value>)",
        "surface-hover": "rgb(var(--surface-hover) / <alpha-value>)",
        main:          "rgb(var(--text-main) / <alpha-value>)",
        muted:         "rgb(var(--text-muted) / <alpha-value>)",
        primary: {
          DEFAULT: "#00f2fe",
          dark: "#00c2cb",
          light: "#7ffcff",
        },
        secondary: {
          DEFAULT: "#7000ff",
          dark: "#5a00cc",
          light: "#a060ff",
        },
        accent:   "#ff007a",
        success:  "#00ffa3",
        warning:  "#fefb00",
        error:    "#ff4d4d",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neon-glow': 'linear-gradient(135deg, #00f2fe, #7000ff)',
        'neon-glow-warm': 'linear-gradient(135deg, #ff007a, #7000ff)',
        'neon-glow-success': 'linear-gradient(135deg, #00ffa3, #00f2fe)',
      },
      boxShadow: {
        'neon':          '0 0 20px rgba(0, 242, 254, 0.45), 0 0 40px rgba(0, 242, 254, 0.15)',
        'neon-sm':       '0 0 10px rgba(0, 242, 254, 0.35)',
        'neon-purple':   '0 0 20px rgba(112, 0, 255, 0.45), 0 0 40px rgba(112, 0, 255, 0.15)',
        'neon-accent':   '0 0 20px rgba(255, 0, 122, 0.4)',
        'neon-success':  '0 0 20px rgba(0, 255, 163, 0.4)',
        'card-dark':     '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0,0,0,0.2)',
        'card-light':    '0 2px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'glow-primary':  '0 0 0 3px rgba(0, 242, 254, 0.15)',
        'glow-secondary':'0 0 0 3px rgba(112, 0, 255, 0.15)',
        'inner-glow':    'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'pulse-slow':    'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':         'float 3s ease-in-out infinite',
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.3s ease-out forwards',
        'fade-up':       'fade-up 0.4s ease-out forwards',
        'spin-slow':     'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,242,254,0.3)' },
          '50%':      { boxShadow: '0 0 24px rgba(0,242,254,0.7)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
