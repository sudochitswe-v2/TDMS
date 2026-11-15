import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { AuthResponse } from '../types/auth'
import { GraduationCap, LogIn, ShieldAlert } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await api.post<AuthResponse>('/api/auth/login', { email, password })
      login(data)

      if (data.roles.includes('SystemAdmin') || data.roles.includes('OperationAdmin')) {
        navigate('/admin')
      } else if (data.roles.includes('Tutor')) {
        navigate('/tutor-studio')
      } else {
        navigate('/account')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="rounded-3xl border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <GraduationCap className="h-10 w-10 text-primary mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Sign In to TDMS</h1>
          <p className="text-xs text-muted-foreground">Access your discovery and matching account</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm flex items-center justify-center space-x-2"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2 space-y-2">
          <div>
            Don't have an account yet?{' '}
            <Link to="/register/learner" className="font-semibold text-primary hover:underline">
              Register Learner
            </Link>{' '}
            or{' '}
            <Link to="/register/tutor" className="font-semibold text-primary hover:underline">
              Register as Tutor
            </Link>
          </div>
          <div className="pt-2 border-t">
            <Link
              to="/quick-login"
              className="text-[11px] text-muted-foreground/75 hover:text-primary transition"
            >
              Developer Account Switcher
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
