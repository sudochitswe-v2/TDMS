import React, { createContext, useContext, useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { UserProfile, AuthResponse } from '../types/auth'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isSystemAdmin: boolean
  login: (data: AuthResponse) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'tdms_token'
const USER_KEY = 'tdms_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  })

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [user])

  const login = (data: AuthResponse) => {
    setToken(data.token)
    const profile: UserProfile = {
      userId: data.userId,
      email: data.email,
      fullName: data.fullName,
      roles: data.roles || [],
      claims: data.claims || {},
      accountSubType: data.accountSubType,
      tutorVerificationStatus: data.tutorVerificationStatus,
    }
    setUser(profile)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const isSystemAdmin = user?.roles?.includes('SystemAdmin') ?? false

  const hasPermission = (permission: string): boolean => {
    if (!user || !token) return false
    if (isSystemAdmin) return true
    return Boolean(user.claims && (user.claims[permission] === 'true' || user.claims[permission]))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isSystemAdmin,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useHasPermission(permission: string): boolean {
  const { hasPermission } = useAuth()
  return hasPermission(permission)
}

export interface HasPermissionProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const HasPermission: React.FC<HasPermissionProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const permitted = useHasPermission(permission)
  if (!permitted) return <>{fallback}</>
  return <>{children}</>
}

export interface RequirePermissionProps {
  permission: string
  children: React.ReactNode
  redirectTo?: string
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
  redirectTo = '/',
}) => {
  const permitted = useHasPermission(permission)
  if (!permitted) {
    return <Navigate to={redirectTo} replace />
  }
  return <>{children}</>
}
