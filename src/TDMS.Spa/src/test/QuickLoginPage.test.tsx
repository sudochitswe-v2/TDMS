import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QuickLoginPage } from '../pages/QuickLoginPage'
import { LoginPage } from '../pages/LoginPage'
import { AuthProvider } from '../context/AuthContext'
import { getDailyAccessCode } from '../lib/passcode'
import { api } from '../lib/api'

// Mock api calls
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockUsers = [
  {
    id: 'user-admin',
    fullName: 'System Administrator',
    email: 'admin@tdms.local',
    userName: 'sysadmin',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    roles: ['SystemAdmin'],
    accountType: 'Admin',
  },
  {
    id: 'user-tutor',
    fullName: 'Dr. Jane Math Tutor',
    email: 'tutor.math@tdms.local',
    userName: 'tutor_math',
    isActive: true,
    createdAt: '2026-01-02T00:00:00Z',
    roles: ['Tutor'],
    accountType: 'Tutor',
    headlineOrGrade: 'PhD in Mathematics',
    tutorStatus: 'Approved',
  },
  {
    id: 'user-student',
    fullName: 'Alice Student',
    email: 'student1@tdms.local',
    userName: 'student1',
    isActive: true,
    createdAt: '2026-01-03T00:00:00Z',
    roles: ['ParentStudent'],
    accountType: 'Student',
    headlineOrGrade: 'Grade 11',
  },
]

describe('QuickLoginPage & Impersonation Gate Flow', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue(mockUsers)
  })

  it('renders Developer Access Gate without hints when locked', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <QuickLoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(screen.getByText('Developer Access Gate')).toBeDefined()
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined()
    expect(screen.getByRole('button', { name: /unlock account switcher/i })).toBeDefined()

    // Assert that no hints or format clues are displayed to the user
    expect(screen.queryByText(/DDMMYY/i)).toBeNull()
    expect(screen.queryByText(/301226/i)).toBeNull()
    expect(screen.queryByText(/Password changes/i)).toBeNull()
  })

  it('rejects invalid password and shows clean error message without hints', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <QuickLoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    const input = screen.getByPlaceholderText('••••••••')
    const button = screen.getByRole('button', { name: /unlock account switcher/i })

    fireEvent.change(input, { target: { value: '000000' } })
    fireEvent.click(button)

    expect(screen.getByText('Invalid access password.')).toBeDefined()
    expect(screen.queryByText(/DDMMYY/i)).toBeNull()
  })

  it('unlocks and displays user accounts when entering valid daily passcode', async () => {
    const todayPasscode = getDailyAccessCode()

    render(
      <AuthProvider>
        <MemoryRouter>
          <QuickLoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    const input = screen.getByPlaceholderText('••••••••')
    const button = screen.getByRole('button', { name: /unlock account switcher/i })

    fireEvent.change(input, { target: { value: todayPasscode } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Account Switcher')).toBeDefined()
      expect(screen.getByText('System Administrator')).toBeDefined()
      expect(screen.getByText('Dr. Jane Math Tutor')).toBeDefined()
      expect(screen.getByText('Alice Student')).toBeDefined()
    })
  })

  it('filters users by search input and role tabs', async () => {
    sessionStorage.setItem('tdms_quick_login_unlocked', 'true')

    render(
      <AuthProvider>
        <MemoryRouter>
          <QuickLoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('System Administrator')).toBeDefined()
    })

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Search by name/i)
    fireEvent.change(searchInput, { target: { value: 'math' } })

    expect(screen.getByText('Dr. Jane Math Tutor')).toBeDefined()
    expect(screen.queryByText('System Administrator')).toBeNull()

    // Reset search
    fireEvent.change(searchInput, { target: { value: '' } })

    // Role tab filter
    const tutorTab = screen.getByRole('button', { name: /Tutors/i })
    fireEvent.click(tutorTab)

    expect(screen.getByText('Dr. Jane Math Tutor')).toBeDefined()
    expect(screen.queryByText('Alice Student')).toBeNull()
  })

  it('authenticates user and saves token on clicking login button', async () => {
    sessionStorage.setItem('tdms_quick_login_unlocked', 'true')
    vi.mocked(api.post).mockResolvedValueOnce({
      token: 'jwt-admin-token',
      userId: 'user-admin',
      email: 'admin@tdms.local',
      fullName: 'System Administrator',
      roles: ['SystemAdmin'],
      claims: {},
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    })

    render(
      <AuthProvider>
        <MemoryRouter>
          <QuickLoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('System Administrator')).toBeDefined()
    })

    const loginButtons = screen.getAllByRole('button', { name: /Login as this User/i })
    fireEvent.click(loginButtons[0])

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/quick-login', {
        userId: 'user-admin',
        email: 'admin@tdms.local',
      })
      expect(localStorage.getItem('tdms_token')).toBe('jwt-admin-token')
    })
  })

  it('locks the gate when clicking Lock Gate button', async () => {
    sessionStorage.setItem('tdms_quick_login_unlocked', 'true')

    render(
      <AuthProvider>
        <MemoryRouter>
          <QuickLoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Account Switcher')).toBeDefined()
    })

    const lockBtn = screen.getByRole('button', { name: /Lock Gate/i })
    fireEvent.click(lockBtn)

    expect(screen.getByText('Developer Access Gate')).toBeDefined()
    expect(sessionStorage.getItem('tdms_quick_login_unlocked')).toBeNull()
  })
})

describe('LoginPage without Demo Quick Sign-In', () => {
  it('does not contain Demo Quick Sign-In or preset account buttons', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(screen.queryByText('Demo Quick Sign-In')).toBeNull()
    expect(screen.queryByText('admin@tdms.local')).toBeNull()
    expect(screen.queryByText('ops@tdms.local')).toBeNull()
    expect(screen.queryByText(/Key: Password123!/i)).toBeNull()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined()
  })
})
