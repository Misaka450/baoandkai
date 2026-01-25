import { Outlet, useLocation } from 'react-router-dom'
import Navigation from './Navigation'
import Icon from './icons/Icons'

export default function Layout() {
  const location = useLocation()

  // 在后台管理页面隐藏顶部导航栏
  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-background-light text-slate-700 transition-colors duration-300 overflow-x-hidden">
      {/* 装饰性背景元素 - 增加更多浮动图标 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* 左上角 */}
        <div className="absolute top-20 left-10 text-stone-300 opacity-20 animate-float">
          <Icon name="auto_awesome" size={60} />
        </div>
        <div className="absolute top-40 left-20 text-slate-200 opacity-15 animate-float" style={{ animationDelay: '-1s' }}>
          <Icon name="star" size={40} />
        </div>

        {/* 右上角 */}
        <div className="absolute top-32 right-12 text-blue-100 opacity-15 animate-float" style={{ animationDelay: '-4s' }}>
          <Icon name="wb_cloudy" size={70} />
        </div>
        <div className="absolute top-60 right-32 text-stone-200 opacity-20 animate-float" style={{ animationDelay: '-2s' }}>
          <Icon name="favorite" size={50} />
        </div>

        {/* 左下角 */}
        <div className="absolute bottom-40 left-12 text-slate-100 opacity-15 animate-float" style={{ animationDelay: '-3s' }}>
          <Icon name="wb_cloudy" size={80} />
        </div>
        <div className="absolute bottom-20 left-32 text-stone-300 opacity-25 animate-float" style={{ animationDelay: '-1.5s' }}>
          <Icon name="favorite" size={40} />
        </div>

        {/* 右下角 */}
        <div className="absolute bottom-24 right-10 text-stone-300 opacity-25 animate-float" style={{ animationDelay: '-2.5s' }}>
          <Icon name="favorite" size={50} />
        </div>
        <div className="absolute bottom-10 right-32 text-slate-300 opacity-15 animate-float" style={{ animationDelay: '-5s' }}>
          <Icon name="auto_awesome" size={40} />
        </div>

        {/* 屏幕中央散落 */}
        <div className="absolute top-1/2 left-1/4 text-stone-200 opacity-15 animate-float" style={{ animationDelay: '-6s' }}>
          <Icon name="star" size={30} />
        </div>
        <div className="absolute top-1/3 right-1/4 text-stone-200 opacity-15 animate-float" style={{ animationDelay: '-7s' }}>
          <Icon name="favorite" size={24} />
        </div>
      </div>

      {/* 只在非后台页面显示导航栏 */}
      {!isAdminPage && <Navigation />}

      <main className="relative z-10">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* 背景光晕 - 确保不受字体加载影响 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-stone-200/10 to-slate-200/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-200/10 to-stone-200/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
      </div>
    </div>
  )
}