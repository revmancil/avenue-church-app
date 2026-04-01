/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        church: {
          50:  '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8a4a4',
          400: '#f26666',
          500: '#991b1b',
          600: '#7f1d1d',
          700: '#6b1414',
          800: '#540f0f',
          900: '#3d0a0a',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
