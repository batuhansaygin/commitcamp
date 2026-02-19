/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zinc: {
          925: '#111113',
          950: '#09090b',
        },
      },
      animation: {
        'float': 'float 5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'fade-in-up-delay-1': 'fadeInUp 0.7s ease-out 0.15s forwards',
        'fade-in-up-delay-2': 'fadeInUp 0.7s ease-out 0.3s forwards',
        'fade-in-up-delay-3': 'fadeInUp 0.7s ease-out 0.45s forwards',
        'fade-in-up-delay-4': 'fadeInUp 0.7s ease-out 0.6s forwards',
        'fade-in-up-delay-5': 'fadeInUp 0.7s ease-out 0.8s forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
