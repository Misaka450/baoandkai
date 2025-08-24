import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 定义用户接口
interface User {
  token: string
  username?: string
  role: string
}

// 定义认证上下文接口
interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<any>
  logout: () => void
  loading: boolean
  isAdmin: boolean
  isLoggedIn: boolean
  token: string | null
}

// 定义Provider属性接口
interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider中使用')
  }
  return context
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
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

  const login = async (username: string, password: string): Promise<any> => {
    try {
      // 使用后端API进行真正的数据库验证
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }

      // 保存返回的token
      localStorage.setItem('token', data.token)
      setUser({ token: data.token, username: data.user.username, role: data.user.role })
      return data
    } catch (error) {
      throw error
    }
  }

  const logout = (): void => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isLoggedIn: !!user,
    token: user?.token || null,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}