import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext'
import { MainLayout } from '../layouts/MainLayout'

describe('NavBar Layout and Profile Dropdown Flow', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    localStorage.clear()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const renderWithProviders = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <MainLayout />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

  it('renders full-width navbar without container mx-auto constraints when unauthenticated', () => {
    const { container } = renderWithProviders()

    const navContainer = container.querySelector('header > div')
    expect(navContainer).toHaveClass('w-full')
    expect(navContainer).not.toHaveClass('container')
    expect(navContainer).not.toHaveClass('mx-auto')

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Join as Learner')).toBeInTheDocument()
    expect(screen.queryByLabelText('User profile menu')).not.toBeInTheDocument()
  })

  it('renders only profile icon for authenticated Learner and toggles dropdown with redirect to /account', () => {
    localStorage.setItem('tdms_token', 'mock-learner-token')
    localStorage.setItem(
      'tdms_user',
      JSON.stringify({
        token: 'mock-learner-token',
        userId: 'learner-1',
        email: 'learner@example.com',
        fullName: 'Jane Learner',
        roles: ['ParentStudent'],
        claims: {
          'view:menu:learner_account': 'true',
          'view:menu:find_tutors': 'true',
        },
        accountSubType: 'Student',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    )

    renderWithProviders()

    // Verify raw user text and standalone logout button are not directly visible in navbar
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByText('ParentStudent')).not.toBeInTheDocument()

    // Profile icon button should be present
    const profileBtn = screen.getByLabelText('User profile menu')
    expect(profileBtn).toBeInTheDocument()

    // Open dropdown
    fireEvent.click(profileBtn)

    // Dropdown elements should now be visible
    expect(screen.getByText('Jane Learner')).toBeInTheDocument()
    expect(screen.getByText('learner@example.com')).toBeInTheDocument()

    // Profile link should redirect to /account for learner
    const profileLink = screen.getByRole('menuitem', { name: /Profile/i })
    expect(profileLink).toHaveAttribute('href', '/account')

    // Logout button should be present
    expect(screen.getByRole('menuitem', { name: /Log Out/i })).toBeInTheDocument()
  })

  it('redirects Tutor profile button to /tutor-studio in dropdown', () => {
    localStorage.setItem('tdms_token', 'mock-tutor-token')
    localStorage.setItem(
      'tdms_user',
      JSON.stringify({
        token: 'mock-tutor-token',
        userId: 'tutor-1',
        email: 'tutor@example.com',
        fullName: 'Dr. John Tutor',
        roles: ['Tutor'],
        claims: {
          'view:menu:tutor_workspace': 'true',
        },
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    )

    renderWithProviders()

    const profileBtn = screen.getByLabelText('User profile menu')
    fireEvent.click(profileBtn)

    const profileLink = screen.getByRole('menuitem', { name: /Profile/i })
    expect(profileLink).toHaveAttribute('href', '/tutor-studio')
  })

  it('closes the profile dropdown when pressing Escape key', () => {
    localStorage.setItem('tdms_token', 'mock-token')
    localStorage.setItem(
      'tdms_user',
      JSON.stringify({
        token: 'mock-token',
        userId: 'u-1',
        email: 'user@example.com',
        fullName: 'Test User',
        roles: ['ParentStudent'],
        claims: {},
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    )

    renderWithProviders()

    const profileBtn = screen.getByLabelText('User profile menu')
    fireEvent.click(profileBtn)
    expect(screen.getByText('Test User')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Test User')).not.toBeInTheDocument()
  })
})
