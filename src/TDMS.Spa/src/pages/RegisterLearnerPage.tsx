import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { AuthResponse } from '../types/auth'
import { GraduationCap, UserPlus, Users, User } from 'lucide-react'

export const RegisterLearnerPage: React.FC = () => {
  const [accountSubType, setAccountSubType] = useState<'Parent' | 'Student'>('Student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [preferredMaxHourlyFee, setPreferredMaxHourlyFee] = useState(35000)
  const [preferredTeachingMode, setPreferredTeachingMode] = useState('Both')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await api.post<AuthResponse>('/api/auth/register/learner', {
        fullName,
        email,
        password,
        accountSubType,
        gradeLevel: gradeLevel || null,
        preferredMaxHourlyFee,
        preferredTeachingMode,
      })

      login(data)
      navigate('/account')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <div className="rounded-3xl border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <GraduationCap className="h-10 w-10 text-primary mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Create Learner Account</h1>
          <p className="text-xs text-muted-foreground">Join as a Student or Parent searching for expert guidance</p>
        </div>

        {/* Account SubType Selector */}
        <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-secondary/50 border">
          <button
            type="button"
            onClick={() => setAccountSubType('Student')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              accountSubType === 'Student'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            <span>I am a Student</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountSubType('Parent')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              accountSubType === 'Parent'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>I am a Parent</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder={accountSubType === 'Parent' ? 'Parent / Guardian Name' : 'Student Full Name'}
              className="w-full px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Grade / Level</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. High School, Grade 10"
                className="w-full px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Teaching Mode</label>
              <select
                value={preferredTeachingMode}
                onChange={(e) => setPreferredTeachingMode(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Both">Both (Flexible)</option>
                <option value="Online">Online Only</option>
                <option value="InPerson">In-Person Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-semibold">Target Hourly Budget</label>
              <span className="font-bold text-primary">{preferredMaxHourlyFee.toLocaleString()} MMK / hr</span>
            </div>
            <input
              type="range"
              min="5000"
              max="100000"
              step="5000"
              value={preferredMaxHourlyFee}
              onChange={(e) => setPreferredMaxHourlyFee(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm flex items-center justify-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>{loading ? 'Creating Account...' : `Register as ${accountSubType}`}</span>
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
