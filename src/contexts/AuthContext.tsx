import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getCookieValue, deleteCookie } from '../utils/cookie'

interface User {
  username?: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<any>
  logout: () => Promise<void>
  loading: boolean
  isAdmin: boolean
  isLoggedIn: boolean
  csrfToken: string | null
}

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
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 验证登录状态（会话恢复）
  // 注意：auth_token 是 HttpOnly Cookie，前端 JS 读不到（这是安全特性），
  // 所以这里直接调用 check-token 接口，由服务端从 Cookie 中校验，
  // 浏览器会自动携带 Cookie（credentials: same-origin）
  const validateToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check-token', {
        credentials: 'same-origin'
      })
      const data = await response.json()

      if (data.valid && data.user) {
        // csrf_token 不是 HttpOnly，前端可以正常读取
        const csrf = getCookieValue('csrf_token')
        setCsrfToken(csrf)
        setUser({
          username: data.user.username,
          role: 'admin'
        })
      } else {
        // 会话无效：清理前端可读的 csrf_token 残留
        deleteCookie('csrf_token')
        setCsrfToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Token 验证失败:', error)
      setCsrfToken(null)
      setUser(null)
    } finally {
      // 无论成功失败都要结束 loading，避免页面卡在加载状态
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    validateToken()
  }, [validateToken])

  const login = async (username: string, password: string): Promise<any> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '登录失败')
    }

    // 登录成功后，后端已设置HttpOnly Cookie
    // 优先从响应体获取 CSRF Token（比从 Cookie 读取更可靠）
    const csrf = data.csrfToken || getCookieValue('csrf_token')
    setCsrfToken(csrf)
    setUser({ username: data.user.username, role: data.user.role })
    return data
  }

  const logout = async (): Promise<void> => {
    // 1. 先通知服务端：删除数据库中的 Session 记录，
    //    让这个登录凭证真正失效（而不是仅仅浏览器删 Cookie）
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': getCookieValue('csrf_token') || '' }
      })
    } catch (error) {
      // 网络失败也要继续清理本地状态，保证前端一定能退出
      console.error('登出请求失败:', error)
    }

    // 2. 清理前端残留状态（auth_token 是 HttpOnly，由服务端响应负责删除）
    deleteCookie('csrf_token')
    // 清除localStorage中可能残留的旧Token
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCsrfToken(null)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isLoggedIn: !!user,
    csrfToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
