import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查本地存储中的登录状态
    const token = localStorage.getItem('token')
    if (token) {
      // 验证token有效性
      setUser({ token, role: 'admin' })
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      // 本地验证逻辑，生产环境应该使用API
      if (username === 'admin' && password === 'admin123') {
        const token = 'admin-token-' + Date.now()
        localStorage.setItem('token', token)
        setUser({ token, username: 'admin', role: 'admin' })
        return { token, user: { username: 'admin', role: 'admin' } }
      } else {
        throw new Error('用户名或密码错误')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isLoggedIn: !!user,
    token: user?.token,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}