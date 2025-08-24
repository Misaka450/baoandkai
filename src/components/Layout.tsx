import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

// 布局组件 - 提供页面基本布局结构
export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-primary">
      <Navigation />
      <main className="pt-20 pb-8">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
      
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        {/* 极简优雅的配色方案，统一使用莫兰迪色系 */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}