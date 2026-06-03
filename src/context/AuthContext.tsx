import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginRequest, RegisterRequest } from '../types'
import api from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const storeSession = (user: User, token: string, refreshToken: string) => {
    setUser(user)
    setToken(token)
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
  }

  const login = async (data: LoginRequest) => {
    const response = await api.post('/auth/login', data)
    const { user, token, refreshToken } = response.data.data
    storeSession(user, token, refreshToken)
  }

  const register = async (data: RegisterRequest) => {
    const response = await api.post('/auth/register', data)
    const { user, token, refreshToken } = response.data.data
    storeSession(user, token, refreshToken)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken })
    } catch {
      // ignore — clear local state regardless
    }
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
