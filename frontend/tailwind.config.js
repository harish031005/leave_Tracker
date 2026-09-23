/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream:   { DEFAULT: '#FAF9F6', dark: '#1a1a2e' },
        indigo:  { DEFAULT: '#4F46E5', light: '#6366F1', dark: '#3730A3', 50: '#EEF2FF' },
        amber:   { DEFAULT: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
        emerald: { DEFAULT: '#059669', light: '#34D399', dark: '#047857' },
        rose:    { DEFAULT: '#E11D48', light: '#FB7185', dark: '#BE123C' },
        slate:   { DEFAULT: '#64748B', light: '#94A3B8', dark: '#334155', 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 700: '#334155', 800: '#1E293B', 900: '#0F172A' },
        surface: { DEFAULT: '#FFFFFF', dark: '#16213E' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(79, 70, 229, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
