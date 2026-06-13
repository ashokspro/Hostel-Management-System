/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind to scan ALL jsx files inside src/
  // If a file isn't listed here, its Tailwind classes get purged in production
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors matching your backend's design system
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      // Custom font
      fontFamily: {
        sans: ['DM Sans', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Segoe UI', 'sans-serif'],
      },
      // ── New: custom keyframe animation ──────────────────
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 0.4s ease-out',
      }
    },
  },
  plugins: [],
}