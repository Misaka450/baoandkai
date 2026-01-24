/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f472b6",
        "background-light": "#fdfbf7",
        "background-dark": "#1a1617",
        "pastel-pink": "#fee2e2",
        "pastel-yellow": "#fef9c3",
        "pastel-blue": "#dcfce7",
        "pastel-purple": "#ede9fe",
        "pastel-green": "#f0fdf4",
        "sage": "#A8D5BA",
        "secondary": "#B0E0E6",
      },
      fontFamily: {
        'sans': ['Nunito', 'Quicksand', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        'display': ['"ZCOOL KuaiLe"', 'Quicksand', 'cursive'],
        'handwriting': ['"Ma Shan Zheng"', 'cursive'],
      },
      borderRadius: {
        'large': '2rem',
        'xlarge': '3rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'heart-pop': 'heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        heartPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.4)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(15px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  safelist: [
    'bg-primary', 'bg-secondary', 'bg-sage',
    'bg-pastel-pink', 'bg-pastel-yellow', 'bg-pastel-blue', 'bg-pastel-purple', 'bg-pastel-green',
    'animate-float', 'animate-heart-pop',
    'animate-fade-in', 'animate-slide-up', 'animate-fade-in-up',
    'rotate-1', 'rotate-2', 'rotate-3', 'rotate-[-1deg]', 'rotate-[-2deg]', 'rotate-[-3deg]'
  ],
  plugins: [],
}