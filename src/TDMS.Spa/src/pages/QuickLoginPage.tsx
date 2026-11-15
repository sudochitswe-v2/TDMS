import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { AuthResponse } from '../types/auth'
import { validateDailyAccessCode } from '../lib/passcode'
import {
  KeyRound,
  Lock,
  Unlock,
  ShieldAlert,
  LogIn,
  Search,
  Eye,
  EyeOff,
  Users,
  Shield,
  GraduationCap,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

export interface QuickUser {
  id: string
  fullName: string
  email: string
  userName: string
  isActive: boolean
  createdAt: string
  roles: string[]
  accountType: string
  headlineOrGrade?: string
  tutorStatus?: string
}

const STORAGE_KEY = 'tdms_quick_login_unlocked'

export const QuickLoginPage: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEY) === 'true'
  })
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [gateError, setGateError] = useState('')

  const [users, setUsers] = useState<QuickUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'tutor' | 'learner'>('all')
  const [authenticatingId, setAuthenticatingId] = useState<string | null>(null)
  const [authError, setAuthError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isUnlocked) {
      loadUsers()
    }
  }, [isUnlocked])

  const loadUsers = async () => {
    setLoadingUsers(true)
    setFetchError('')
    try {
      const data = await api.get<QuickUser[]>('/api/auth/quick-login/users')
      setUsers(data)
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load user accounts.')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    setGateError('')

    if (validateDailyAccessCode(passcode)) {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      setIsUnlocked(true)
      setPasscode('')
    } else {
      setGateError('Invalid access password.')
    }
  }

  const handleLock = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setIsUnlocked(false)
    setPasscode('')
    setGateError('')
  }

  const handleQuickSignIn = async (user: QuickUser) => {
    setAuthenticatingId(user.id)
    setAuthError('')

    try {
      const data = await api.post<AuthResponse>('/api/auth/quick-login', {
        userId: user.id,
        email: user.email,
      })
      login(data)

      if (data.roles.includes('SystemAdmin') || data.roles.includes('OperationAdmin')) {
        navigate('/admin')
      } else if (data.roles.includes('Tutor')) {
        navigate('/tutor-studio')
      } else {
        navigate('/account')
      }
    } catch (err: any) {
      setAuthError(err.message || `Failed to sign in as ${user.fullName}`)
    } finally {
      setAuthenticatingId(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.userName.toLowerCase().includes(search.toLowerCase()) ||
      (u.headlineOrGrade && u.headlineOrGrade.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (roleFilter === 'admin') {
      return u.roles.some((r) => r.includes('Admin'))
    }
    if (roleFilter === 'tutor') {
      return u.roles.includes('Tutor')
    }
    if (roleFilter === 'learner') {
      return (
        u.roles.includes('ParentStudent') ||
        u.roles.includes('Learner') ||
        (!u.roles.some((r) => r.includes('Admin')) && !u.roles.includes('Tutor'))
      )
    }
    return true
  })

  // 1. Password Gate Screen (when locked)
  if (!isUnlocked) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="rounded-3xl border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Developer Access Gate</h1>
            <p className="text-xs text-muted-foreground">
              Enter the access password to view the account switcher.
            </p>
          </div>

          {gateError && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{gateError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Access Password</label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  required
                  className="w-full pl-3 pr-10 py-2.5 text-sm rounded-xl border bg-background font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm flex items-center justify-center space-x-2"
            >
              <Unlock className="h-4 w-4" />
              <span>Unlock Account Switcher</span>
            </button>
          </form>

          <div className="pt-4 border-t text-center text-xs text-muted-foreground">
            Want to use regular login?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. Unlocked User Switcher Screen
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl border bg-card shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Account Switcher</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center space-x-1">
              <Unlock className="h-3 w-3" />
              <span>Unlocked</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sign in directly to any user account without entering their password.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadUsers}
            disabled={loadingUsers}
            className="px-3 py-2 text-xs font-semibold rounded-xl border bg-background hover:bg-secondary transition flex items-center space-x-1.5"
            title="Refresh user list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLock}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition flex items-center space-x-1.5"
            title="Lock access"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Lock Gate</span>
          </button>
        </div>
      </div>

      {authError && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {fetchError && (
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button onClick={loadUsers} className="underline font-semibold hover:opacity-80">
            Retry
          </button>
        </div>
      )}

      {/* Search and Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role, or subject..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 p-1 bg-secondary/50 rounded-xl text-xs overflow-x-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-background shadow-xs text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Accounts ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              roleFilter === 'admin'
                ? 'bg-background shadow-xs text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Admins ({users.filter((u) => u.roles.some((r) => r.includes('Admin'))).length})
          </button>
          <button
            onClick={() => setRoleFilter('tutor')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              roleFilter === 'tutor'
                ? 'bg-background shadow-xs text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tutors ({users.filter((u) => u.roles.includes('Tutor')).length})
          </button>
          <button
            onClick={() => setRoleFilter('learner')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              roleFilter === 'learner'
                ? 'bg-background shadow-xs text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Learners ({users.filter((u) => !u.roles.some((r) => r.includes('Admin')) && !u.roles.includes('Tutor')).length})
          </button>
        </div>
      </div>

      {/* User Cards / List */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        {loadingUsers ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Loading accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-semibold">No accounts match your criteria</p>
            <p className="text-xs text-muted-foreground">Try clearing your search query or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredUsers.map((user) => {
              const isAdmin = user.roles.some((r) => r.includes('Admin'))
              const isTutor = user.roles.includes('Tutor')
              const isLearner = !isAdmin && !isTutor

              return (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition"
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        isAdmin
                          ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                          : isTutor
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {isAdmin ? (
                        <Shield className="h-5 w-5" />
                      ) : isTutor ? (
                        <GraduationCap className="h-5 w-5" />
                      ) : (
                        <BookOpen className="h-5 w-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{user.fullName}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">@{user.userName}</span>

                        {/* Role Tags */}
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              role === 'SystemAdmin'
                                ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                : role === 'OperationAdmin'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : role === 'Tutor'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-secondary text-foreground'
                            }`}
                          >
                            {role}
                          </span>
                        ))}

                        {user.tutorStatus && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              user.tutorStatus === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}
                          >
                            {user.tutorStatus}
                          </span>
                        )}

                        {!user.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                            Suspended
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span className="font-mono text-[11px] text-foreground/80">{user.email}</span>
                        {user.headlineOrGrade && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">{user.headlineOrGrade}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{user.accountType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Login Button */}
                  <div className="shrink-0 flex items-center sm:self-center">
                    <button
                      onClick={() => handleQuickSignIn(user)}
                      disabled={!user.isActive || authenticatingId === user.id}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 disabled:opacity-50 transition shadow-xs flex items-center justify-center space-x-1.5"
                    >
                      {authenticatingId === user.id ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="h-3.5 w-3.5" />
                          <span>Login as this User</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4">
        Need standard email/password authentication?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Go to Standard Sign In
        </Link>
      </div>
    </div>
  )
}
