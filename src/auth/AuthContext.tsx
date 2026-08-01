import {
  createContext,
  use,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '../api/auth'
import {
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  type AuthUser,
} from '../lib/token'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      async login(email, password) {
        const result = await authApi.login(email, password)
        setToken(result.token)
        setStoredUser(result.user)
        setTokenState(result.token)
        setUser(result.user)
      },
      async signup(email, password, passwordConfirmation) {
        const result = await authApi.signup(email, password, passwordConfirmation)
        setToken(result.token)
        setStoredUser(result.user)
        setTokenState(result.token)
        setUser(result.user)
      },
      async logout() {
        const current = getToken()
        if (current) {
          try {
            await authApi.logout(current)
          } catch {
            // still clear local session
          }
        }
        clearToken()
        setTokenState(null)
        setUser(null)
      },
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
