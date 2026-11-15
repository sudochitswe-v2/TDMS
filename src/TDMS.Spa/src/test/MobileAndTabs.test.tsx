import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext'
import { MainLayout } from '../layouts/MainLayout'
import { LearnerAccountPage } from '../pages/LearnerAccountPage'
import { TutorStudioPage } from '../pages/TutorStudioPage'
import { api } from '../lib/api'

// Mock api calls
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Mobile Navigation and Responsive Tabs Suite', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  describe('MainLayout Mobile Responsiveness', () => {
    it('renders mobile bottom navigation bar with Guest destinations when unauthenticated', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/']}>
            <AuthProvider>
              <MainLayout />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      )

      const bottomNav = screen.getByRole('navigation', { name: /Mobile Navigation/i })
      expect(bottomNav).toBeInTheDocument()
      expect(bottomNav).toHaveClass('md:hidden')

      // Check Guest bottom nav options inside bottomNav
      expect(within(bottomNav).getByRole('link', { name: /Login/i })).toBeInTheDocument()
      expect(within(bottomNav).getByRole('link', { name: /Register/i })).toBeInTheDocument()
    })

    it('renders Learner-specific tabs on mobile bottom bar when authenticated as Learner', () => {
      localStorage.setItem('tdms_token', 'mock-token')
      localStorage.setItem(
        'tdms_user',
        JSON.stringify({
          token: 'mock-token',
          userId: 'learner-1',
          email: 'student@example.com',
          fullName: 'Kyaw Kyaw',
          roles: ['ParentStudent'],
          claims: {
            'view:menu:learner_account': 'true',
            'view:menu:find_tutors': 'true',
            'view:menu:messaging': 'true',
            'view:menu:feedback': 'true',
          },
          accountSubType: 'Student',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        })
      )

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/account']}>
            <AuthProvider>
              <MainLayout />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      )

      const bottomNav = screen.getByRole('navigation', { name: /Mobile Navigation/i })
      expect(bottomNav).toBeInTheDocument()

      // Should show Requirements link for student in bottom nav
      expect(within(bottomNav).getByRole('link', { name: /Requirements/i })).toHaveAttribute('href', '/account')
      expect(within(bottomNav).getByRole('link', { name: /Find Tutors/i })).toHaveAttribute('href', '/tutors')
    })

    it('renders Tutor-specific tabs on mobile bottom bar when authenticated as Tutor', () => {
      localStorage.setItem('tdms_token', 'mock-tutor-token')
      localStorage.setItem(
        'tdms_user',
        JSON.stringify({
          token: 'mock-tutor-token',
          userId: 'tutor-1',
          email: 'tutor@example.com',
          fullName: 'Sayar Min',
          roles: ['Tutor'],
          claims: {
            'view:menu:tutor_workspace': 'true',
            'view:menu:find_tutors': 'true',
            'view:menu:messaging': 'true',
            'view:menu:feedback': 'true',
          },
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        })
      )

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/tutor-studio']}>
            <AuthProvider>
              <MainLayout />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      )

      const bottomNav = screen.getByRole('navigation', { name: /Mobile Navigation/i })
      expect(bottomNav).toBeInTheDocument()

      // Should show Studio link for tutor in bottom nav
      expect(within(bottomNav).getByRole('link', { name: /Studio/i })).toHaveAttribute('href', '/tutor-studio')
    })

    it('opens and closes mobile slide-over drawer when menu button is clicked', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/']}>
            <AuthProvider>
              <MainLayout />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      )

      const toggleBtn = screen.getByLabelText(/Toggle mobile navigation menu/i)
      expect(toggleBtn).toBeInTheDocument()

      // Drawer is initially not rendered
      expect(screen.queryByLabelText(/Close navigation drawer/i)).not.toBeInTheDocument()

      // Click to open drawer
      fireEvent.click(toggleBtn)

      // Close button and drawer contents now visible
      const closeBtn = screen.getByLabelText(/Close navigation drawer/i)
      expect(closeBtn).toBeInTheDocument()
      expect(screen.getAllByText(/TDMS Platform/i).length).toBeGreaterThan(0)

      // Click to close drawer
      fireEvent.click(closeBtn)
      expect(screen.queryByLabelText(/Close navigation drawer/i)).not.toBeInTheDocument()
    })
  })

  describe('TutorStudioPage Responsive Tabs', () => {
    it('renders responsive tab controls and navigates between tabs', async () => {
      vi.mocked(api.get).mockImplementation((url: string) => {
        if (url === '/api/tutors/me') {
          return Promise.resolve({
            id: 't-1',
            userId: 'u-1',
            hourlyFee: 25000,
            teachingMode: 'Online',
            yearsOfExperience: 3,
            verificationStatus: 'Verified',
            categories: [{ categoryId: 1, name: 'Physics' }],
            scheduleSlots: [{ dayOfWeek: 1, startTime: '17:00', endTime: '19:00' }],
            documents: [],
            isPublished: true,
            subscriptionPackage: {
              id: 1,
              tierName: 'Pro Tier',
              maxActiveSubjects: 5,
              prioritySearchBoost: 15,
            },
          })
        }
        if (url === '/api/categories') {
          return Promise.resolve([{ id: 1, name: 'Physics' }])
        }
        if (url === '/api/subscriptions') {
          return Promise.resolve([])
        }
        if (url === '/api/subscriptions/my-payments') {
          return Promise.resolve([])
        }
        if (url === '/api/subscriptions/payment-info') {
          return Promise.resolve({ instructions: '', accounts: [] })
        }
        return Promise.resolve({})
      })

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AuthProvider>
              <TutorStudioPage />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      )

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText(/Loading tutor studio workspace/i)).not.toBeInTheDocument()
      })

      // Check tab buttons existence
      const teachingTab = screen.getByRole('button', { name: /Teaching Info & Schedule/i })
      const profileTab = screen.getByRole('button', { name: /Profile Customization & Visibility/i })
      const credentialsTab = screen.getByRole('button', { name: /Verification & Credentials/i })
      const subscriptionTab = screen.getByRole('button', { name: /Subscription Packages/i })

      expect(teachingTab).toBeInTheDocument()
      expect(profileTab).toBeInTheDocument()
      expect(credentialsTab).toBeInTheDocument()
      expect(subscriptionTab).toBeInTheDocument()

      // Teaching tab content should be active initially
      expect(screen.getByText(/Weekly Recurring Availability Slots/i)).toBeInTheDocument()

      // Verify TimeSelect AM/PM selector controls render for tutor availability slots
      expect(screen.getByLabelText('Slot 1 Start AM')).toBeInTheDocument()
      expect(screen.getByLabelText('Slot 1 Start PM')).toBeInTheDocument()
      expect(screen.getByLabelText('Slot 1 End PM')).toBeInTheDocument()
      expect(screen.getByText('5:00 PM – 7:00 PM')).toBeInTheDocument()

      // Switch to Profile tab
      fireEvent.click(profileTab)
      expect(screen.getByText(/Educator Profile Headline & Biography/i)).toBeInTheDocument()

      // Switch to Credentials tab
      fireEvent.click(credentialsTab)
      expect(screen.getByText(/Verified Educator Status/i)).toBeInTheDocument()
    })
  })

  describe('LearnerAccountPage Responsive Tabs', () => {
    it('renders responsive tab controls and enables step navigation for students', async () => {
      vi.mocked(api.get).mockImplementation((url: string) => {
        if (url === '/api/account/learner-profile') {
          return Promise.resolve({
            id: 'l-1',
            userId: 'u-2',
            accountSubType: 'Student',
            preferredMaxHourlyFee: 30000,
            preferredTeachingMode: 'Online',
            categoryIds: [1],
            scheduleSlots: [{ dayOfWeek: 2, startTime: '16:00', endTime: '18:00' }],
          })
        }
        if (url === '/api/categories') {
          return Promise.resolve([{ id: 1, name: 'Mathematics' }, { id: 2, name: 'Chemistry' }])
        }
        return Promise.resolve({})
      })

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AuthProvider>
              <LearnerAccountPage />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText(/Loading learner profile requirements/i)).not.toBeInTheDocument()
      })

      // Tabs
      const prefTab = screen.getByRole('button', { name: /Profile & Style/i })
      const subjTab = screen.getByRole('button', { name: /Subject Needs/i })
      const schedTab = screen.getByRole('button', { name: /Study Availability/i })
      const goalsTab = screen.getByRole('button', { name: /Goals & Notes/i })

      expect(prefTab).toBeInTheDocument()
      expect(subjTab).toBeInTheDocument()
      expect(schedTab).toBeInTheDocument()
      expect(goalsTab).toBeInTheDocument()

      // Step 1: Preferences is active
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()

      // Click Continue to Subjects
      fireEvent.click(screen.getByRole('button', { name: /Continue to Subjects/i }))
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument()
      expect(screen.getByText('Mathematics')).toBeInTheDocument()

      // Click Schedule tab
      fireEvent.click(schedTab)
      expect(screen.getByText(/Preferred Study Availability Slots/i)).toBeInTheDocument()

      // Verify TimeSelect AM/PM selector controls render for learner study availability slots
      expect(screen.getByLabelText('Study Slot 1 Start PM')).toBeInTheDocument()
      expect(screen.getByLabelText('Study Slot 1 End PM')).toBeInTheDocument()
      expect(screen.getByText('4:00 PM – 6:00 PM')).toBeInTheDocument()
    })
  })
})
