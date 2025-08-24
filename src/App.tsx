import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Timeline from './pages/Timeline'
import Albums from './pages/Albums'
import Todos from './pages/Todos'
// 日记功能已移除
import FoodCheckin from './pages/FoodCheckin'
import ErrorDemo from './pages/ErrorDemo'
import Admin from './pages/Admin'
import { AuthProvider } from './contexts/AuthContext'

function App(): JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="albums" element={<Albums />} />
        <Route path="todos" element={<Todos />} />
        {/* 日记功能已移除 */}
        <Route path="food" element={<FoodCheckin />} />
        <Route path="error-demo" element={<ErrorDemo />} />
        <Route path="admin/*" element={<Admin />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App