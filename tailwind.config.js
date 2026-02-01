/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#C9ADA7", // 灰粉 / 莫兰迪粉
        secondary: "#9A9EAB", // 蓝灰
        "background-light": "#F7F3F0", // 暖米灰
        "background-dark": "#4A4E69", // 深紫灰
        "morandi-pink": "#C9ADA7",
        "morandi-blue": "#9A9EAB",
        "morandi-green": "#B7B7A4",
        "morandi-yellow": "#D6CFC7",
        "morandi-purple": "#AAA1C8",
        "morandi-rose": "#DEB3AD",
        "sage": "#B7B7A4", // 豆沙绿
        // 强调色 - 用于计时器卡片等高亮场景
        "accent-pink": "#FF8BB1",
        "accent-blue": "#6BBFFF",
        "accent-green": "#6BCB77",
        "accent-purple": "#A688FA",
        "accent-orange": "#FFB344",
        "accent-red": "#FF7D7D",
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
    'bg-morandi-pink', 'bg-morandi-yellow', 'bg-morandi-blue', 'bg-morandi-purple', 'bg-morandi-green', 'bg-morandi-rose',
    'animate-float', 'animate-heart-pop',
    'animate-fade-in', 'animate-slide-up', 'animate-fade-in-up',
    'rotate-1', 'rotate-2', 'rotate-3', 'rotate-[-1deg]', 'rotate-[-2deg]', 'rotate-[-3deg]'
  ],
  plugins: [],
}