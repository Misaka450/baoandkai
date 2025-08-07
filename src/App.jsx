import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Timeline from './pages/Timeline'
import Albums from './pages/Albums'
import Diary from './pages/Diary'
import FoodCheckin from './pages/FoodCheckin'
import Admin from './pages/Admin'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="albums" element={<Albums />} />
          <Route path="diary" element={<Diary />} />
          <Route path="food" element={<FoodCheckin />} />
          <Route path="admin/*" element={<Admin />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App