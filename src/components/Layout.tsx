import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navigation from './Navigation'
import PageTransition from './PageTransition'

export default function Layout() {
  const location = useLocation()

  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-background-light text-slate-700 transition-colors duration-300 overflow-x-hidden">
      {/* 浮动装饰 - 纯 CSS 实现，比 SVG Icon 更轻量 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ contain: 'strict' }}>
        <div className="absolute top-20 left-10 w-12 h-12 rounded-full bg-stone-300/20 animate-float" />
        <div className="absolute top-40 left-20 w-8 h-8 rounded-full bg-slate-200/15 animate-float" style={{ animationDelay: '-1s' }} />

        <div className="absolute top-32 right-12 w-14 h-8 rounded-full bg-blue-100/15 animate-float" style={{ animationDelay: '-4s' }} />
        <div className="absolute top-60 right-32 w-10 h-10 rounded-full bg-rose-200/20 animate-float" style={{ animationDelay: '-2s' }} />

        <div className="absolute bottom-40 left-12 w-16 h-9 rounded-full bg-blue-100/15 animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute bottom-20 left-32 w-8 h-8 rounded-full bg-rose-200/25 animate-float" style={{ animationDelay: '-1.5s' }} />

        <div className="absolute bottom-24 right-10 w-10 h-10 rounded-full bg-rose-200/25 animate-float" style={{ animationDelay: '-2.5s' }} />
        <div className="absolute bottom-10 right-32 w-8 h-8 rounded-full bg-stone-300/15 animate-float" style={{ animationDelay: '-5s' }} />

        <div className="absolute top-1/2 left-1/4 w-6 h-6 rounded-full bg-slate-200/15 animate-float" style={{ animationDelay: '-6s' }} />
        <div className="absolute top-1/3 right-1/4 w-5 h-5 rounded-full bg-rose-200/15 animate-float" style={{ animationDelay: '-7s' }} />
      </div>

      {!isAdminPage && <Navigation />}

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-stone-200/10 to-slate-200/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-200/10 to-stone-200/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
      </div>
    </div>
  )
}
