import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface User {
  username?: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<any>
  logout: () => void
  loading: boolean
  isAdmin: boolean
  isLoggedIn: boolean
  csrfToken: string | null
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 从浏览器Cookie中读取指定名称的值
 */
function getCookieValue(name: string): string | null {
  const match = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`))
  return match ? match.split('=').slice(1).join('=').trim() : null
}

/**
 * 删除指定Cookie
 */
function deleteCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/; Secure; SameSite=Strict`
}

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

  // 验证Cookie中的Token有效性
  const validateToken = useCallback(async () => {
    const token = getCookieValue('auth_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/check-token', {
        credentials: 'same-origin',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.valid && data.user) {
        const csrf = getCookieValue('csrf_token')
        setCsrfToken(csrf)
        setUser({
          username: data.user.username,
          role: 'admin'
        })
      } else {
        deleteCookie('auth_token')
        deleteCookie('csrf_token')
      }
    } catch (error) {
      console.error('Token 验证失败:', error)
      const csrf = getCookieValue('csrf_token')
      if (csrf) {
        setCsrfToken(csrf)
        setUser({ role: 'user' })
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    validateToken()
  }, [validateToken])

  const login = async (username: string, password: string): Promise<any> => {
    try {
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
      // 从Cookie读取CSRF Token供前端使用
      const csrf = getCookieValue('csrf_token')
      setCsrfToken(csrf)
      setUser({ username: data.user.username, role: data.user.role })
      return data
    } catch (error) {
      throw error
    }
  }

  const logout = (): void => {
    // 清除Cookie（HttpOnly Cookie只能通过设置过期时间删除）
    deleteCookie('auth_token')
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