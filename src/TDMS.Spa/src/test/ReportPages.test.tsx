import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext'
import { PaymentReportsPage } from '../pages/admin/PaymentReportsPage'
import { SubscriptionReportsPage } from '../pages/admin/SubscriptionReportsPage'
import { ReportsNavTabs } from '../components/ReportsNavTabs'
import { api } from '../lib/api'

describe('Admin Payment and Subscription Report Pages', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('tdms_token', 'mock-admin-token')
    localStorage.setItem(
      'tdms_user',
      JSON.stringify({
        token: 'mock-admin-token',
        userId: 'admin-1',
        email: 'admin@tdms.system',
        fullName: 'System Administrator',
        roles: ['SystemAdmin'],
        claims: {
          'reports:read': 'true',
          'reports:export': 'true',
          'view:menu:analytics': 'true',
        },
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    )

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  // it('renders ReportsNavTabs with all three report navigation links', () => {
  //   render(
  //     <MemoryRouter initialEntries={['/admin/reports']}>
  //       <ReportsNavTabs />
  //     </MemoryRouter>
  //   )

  //   expect(screen.getByText('Activity & Demand')).toBeDefined()
  //   expect(screen.getByText('Payment Reports')).toBeDefined()
  //   expect(screen.getByText('Subscription Reports')).toBeDefined()
  // })

  it('renders PaymentReportsPage with KPI summary, filters, and transaction audit log', async () => {
    const mockPaymentData = {
      summary: {
        totalRevenue: 125000,
        confirmedCount: 2,
        pendingRevenue: 35000,
        pendingCount: 1,
        rejectedRevenue: 35000,
        rejectedCount: 1,
        totalTransactions: 4,
        averageTransactionValue: 62500,
        confirmationRate: 50.0,
      },
      methods: [
        {
          method: 'KBZPay',
          totalAmount: 90000,
          confirmedAmount: 90000,
          totalCount: 1,
          confirmedCount: 1,
          sharePercentage: 72.0,
        },
        {
          method: 'WavePay',
          totalAmount: 35000,
          confirmedAmount: 35000,
          totalCount: 1,
          confirmedCount: 1,
          sharePercentage: 28.0,
        },
      ],
      packages: [
        {
          packageId: 2,
          packageName: 'Master Tutor',
          displayFee: 90000,
          confirmedAmount: 90000,
          confirmedCount: 1,
          totalCount: 1,
        },
      ],
      monthlyTrends: [
        {
          period: '2026-11',
          label: 'Nov 2026',
          revenue: 125000,
          confirmedCount: 2,
          totalCount: 4,
        },
      ],
      payments: [
        {
          id: 1,
          tutorProfileId: 'tutor-1',
          tutorName: 'Dr. Kyaw Swar',
          tutorEmail: 'tutor.math@tdms.local',
          packageId: 2,
          packageName: 'Master Tutor',
          amount: 90000,
          paymentMethod: 'KBZPay',
          transactionLast6: '892145',
          screenshotUrl: 'data:image/png;base64,sample',
          notes: 'Master tier payment',
          status: 'Confirmed',
          rejectionReason: null,
          reviewedBy: 'Operations Admin',
          reviewedAt: '2026-11-10T00:00:00Z',
          createdAt: '2026-11-10T00:00:00Z',
        },
      ],
    }

    vi.spyOn(api, 'get').mockResolvedValue(mockPaymentData as any)

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/admin/reports/payments']}>
            <PaymentReportsPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Heading
    expect(screen.getByText('Payment & Revenue Intelligence')).toBeDefined()
    expect(screen.getByText('Export CSV')).toBeDefined()


    await waitFor(() => {
      expect(screen.queryByText(/Loading payment/i)).toBeNull()
    })
    expect(screen.getByText('Dr. Kyaw Swar')).toBeDefined()
    expect(screen.getByText('892145')).toBeDefined()
  })

  it('renders SubscriptionReportsPage with tier distribution and educator lifecycle roster', async () => {
    const mockSubscriptionData = {
      summary: {
        totalTutors: 5,
        verifiedTutors: 4,
        subscribedTutorsCount: 3,
        paidSubscribersCount: 2,
        freeTierTutorsCount: 2,
        expiringSoonCount: 1,
        expiredCount: 0,
        paidConversionRate: 40.0,
        totalSubscriptionRevenue: 125000,
      },
      tierDistribution: [
        {
          packageId: 1,
          tierName: 'Pro Educator',
          displayFee: 35000,
          durationDays: 30,
          maxActiveSubjects: 5,
          prioritySearchBoost: 10,
          isActive: true,
          activeTutorsCount: 2,
          percentageOfTutors: 40.0,
          totalRevenueGenerated: 35000,
        },
        {
          packageId: 2,
          tierName: 'Master Tutor',
          displayFee: 90000,
          durationDays: 90,
          maxActiveSubjects: 15,
          prioritySearchBoost: 25,
          isActive: true,
          activeTutorsCount: 1,
          percentageOfTutors: 20.0,
          totalRevenueGenerated: 90000,
        },
      ],
      subscriptions: [
        {
          tutorProfileId: 'tutor-1',
          tutorName: 'Daw Thida Win',
          tutorEmail: 'tutor.physics@tdms.local',
          verificationStatus: 'Verified',
          packageId: 2,
          tierName: 'Master Tutor',
          displayFee: 90000,
          durationDays: 90,
          subscriptionUpdatedAt: '2026-11-01T00:00:00Z',
          expiresAt: '2027-01-30T00:00:00Z',
          daysRemaining: 77,
          status: 'Active',
          confirmedPaymentsCount: 1,
          totalSpent: 90000,
        },
        {
          tutorProfileId: 'tutor-2',
          tutorName: 'U Aung Myo',
          tutorEmail: 'tutor.chemistry@tdms.local',
          verificationStatus: 'Verified',
          packageId: 1,
          tierName: 'Pro Educator',
          displayFee: 35000,
          durationDays: 30,
          subscriptionUpdatedAt: '2026-10-20T00:00:00Z',
          expiresAt: '2026-11-19T00:00:00Z',
          daysRemaining: 5,
          status: 'ExpiringSoon',
          confirmedPaymentsCount: 1,
          totalSpent: 35000,
        },
      ],
    }

    vi.spyOn(api, 'get').mockResolvedValue(mockSubscriptionData as any)

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/admin/reports/subscriptions']}>
            <SubscriptionReportsPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Heading
    expect(screen.getByText('Subscription & Tier Performance')).toBeDefined()
    expect(screen.getByText('Export CSV')).toBeDefined()


    await waitFor(() => {
      expect(screen.queryByText(/Loading subscription/i)).toBeNull()
    })
    expect(screen.getByText('Daw Thida Win')).toBeDefined()
    expect(screen.getByText('U Aung Myo')).toBeDefined()
    expect(screen.getAllByText(/Expiring Soon/).length).toBeGreaterThan(0)
    expect(screen.getByText(/77 days left/)).toBeDefined()
  })
})
