import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Navigation />
      <main className="pt-20 pb-8">
        <Outlet />
      </main>
    </div>
  )
}