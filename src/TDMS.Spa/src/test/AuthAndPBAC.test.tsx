import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth, HasPermission, RequirePermission } from '../context/AuthContext'
import { MemoryRouter } from 'react-router-dom'

// Test helper component to exercise useAuth and permissions
const TestConsumer: React.FC<{ targetPermission: string }> = ({ targetPermission }) => {
  const { user, login, logout, hasPermission, isAuthenticated, isSystemAdmin } = useAuth()

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</div>
      <div data-testid="is-sysadmin">{isSystemAdmin ? 'YES' : 'NO'}</div>
      <div data-testid="user-email">{user?.email || 'NONE'}</div>
      <div data-testid="perm-check">{hasPermission(targetPermission) ? 'ALLOWED' : 'DENIED'}</div>

      <button
        onClick={() =>
          login({
            token: 'mock-jwt-token',
            userId: 'user-1',
            email: 'learner@example.com',
            fullName: 'Jane Learner',
            roles: ['Learner'],
            claims: {
              'inquiries:create': 'true',
              'view:menu:learner_account': 'true',
            },
            accountSubType: 'Student',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          })
        }
      >
        Login Learner
      </button>

      <button
        onClick={() =>
          login({
            token: 'mock-admin-token',
            userId: 'admin-1',
            email: 'admin@tdms.system',
            fullName: 'Super Admin',
            roles: ['SystemAdmin'],
            claims: {}, // Empty claims to test bypass!
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          })
        }
      >
        Login SysAdmin
      </button>

      <button onClick={() => logout()}>Logout</button>

      <HasPermission permission={targetPermission} fallback={<p>FORBIDDEN_FALLBACK</p>}>
        <p>PROTECTED_CONTENT</p>
      </HasPermission>
    </div>
  )
}

describe('AuthContext and PBAC Permissions Gate', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('denies permission and shows fallback when user is unauthenticated', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer targetPermission="inquiries:create" />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT')
    expect(screen.getByTestId('perm-check')).toHaveTextContent('DENIED')
    expect(screen.getByText('FORBIDDEN_FALLBACK')).toBeInTheDocument()
    expect(screen.queryByText('PROTECTED_CONTENT')).not.toBeInTheDocument()
  })

  it('allows access when user possesses the specific claim', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer targetPermission="inquiries:create" />
        </AuthProvider>
      </MemoryRouter>
    )

    act(() => {
      screen.getByText('Login Learner').click()
    })

    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN')
    expect(screen.getByTestId('perm-check')).toHaveTextContent('ALLOWED')
    expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument()
    expect(screen.queryByText('FORBIDDEN_FALLBACK')).not.toBeInTheDocument()
  })

  it('denies access when user does not possess the specific claim', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer targetPermission="categories:delete" />
        </AuthProvider>
      </MemoryRouter>
    )

    act(() => {
      screen.getByText('Login Learner').click()
    })

    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN')
    expect(screen.getByTestId('perm-check')).toHaveTextContent('DENIED')
    expect(screen.getByText('FORBIDDEN_FALLBACK')).toBeInTheDocument()
    expect(screen.queryByText('PROTECTED_CONTENT')).not.toBeInTheDocument()
  })

  it('bypasses claim checks for SystemAdmin role (even if claim map is empty)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer targetPermission="arbitrary:ultra_sensitive_action" />
        </AuthProvider>
      </MemoryRouter>
    )

    act(() => {
      screen.getByText('Login SysAdmin').click()
    })

    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN')
    expect(screen.getByTestId('is-sysadmin')).toHaveTextContent('YES')
    expect(screen.getByTestId('perm-check')).toHaveTextContent('ALLOWED')
    expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument()
    expect(screen.queryByText('FORBIDDEN_FALLBACK')).not.toBeInTheDocument()
  })

  it('cleans up authentication state on logout', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer targetPermission="inquiries:create" />
        </AuthProvider>
      </MemoryRouter>
    )

    act(() => {
      screen.getByText('Login Learner').click()
    })
    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN')

    act(() => {
      screen.getByText('Logout').click()
    })
    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT')
    expect(screen.getByTestId('perm-check')).toHaveTextContent('DENIED')
    expect(screen.getByText('FORBIDDEN_FALLBACK')).toBeInTheDocument()
    expect(localStorage.getItem('tdms_token')).toBeNull()
  })
})
