import { Link } from 'react-router-dom'
import Icon from '../components/icons/Icons'
import FloatingParticles from '../components/FloatingParticles'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <FloatingParticles count={15} />

      <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pink-200/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-purple-200/20 blur-[60px] md:blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="text-center px-6 animate-fade-in">
        <div className="relative inline-block mb-8">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/80 mx-auto">
            <span className="text-6xl md:text-8xl font-black text-gradient">404</span>
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 md:w-14 md:h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-bounce">
            <Icon name="favorite" size={20} className="text-white md:hidden" />
            <Icon name="favorite" size={28} className="text-white hidden md:block" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">页面走丢啦~</h1>
        <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed">
          别担心，这只是一个小小的迷路。<br />
          让我们回到温暖的小窝吧。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-[2rem] font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-500"
          >
            <Icon name="home" size={20} />
            返回首页
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-3 px-8 py-4 bg-white/80 text-slate-600 rounded-[2rem] font-bold border border-slate-100 hover:bg-white hover:-translate-y-1 transition-all duration-500"
          >
            <Icon name="arrow_back" size={20} />
            返回上一页
          </button>
        </div>
      </div>
    </main>
  )
}