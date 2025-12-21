/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        'chinese': ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
        'extrabold': 800,
      },
      // 动画已在 index.css 中定义，这里保留引用
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
      },
    },
  },
  // 保护动态生成的类名不被清除
  safelist: [
    // 颜色类
    'bg-pink-500', 'bg-pink-600', 'hover:bg-pink-600',
    'text-pink-500', 'border-pink-500',
    'bg-stone-100', 'bg-stone-200', 'text-stone-600', 'text-stone-800',
    'bg-rose-50', 'bg-amber-50', 'bg-green-50', 'bg-blue-50',
    // 优先级颜色
    'bg-red-100', 'text-red-700', 'border-red-200',
    'bg-yellow-100', 'text-yellow-700', 'border-yellow-200',
    'bg-green-100', 'text-green-700', 'border-green-200',
    // 动画类
    'animate-fade-in', 'animate-slide-up', 'animate-fade-in-up',
  ],
  plugins: [],
}