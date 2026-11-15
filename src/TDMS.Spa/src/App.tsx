import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'

// Layouts
import { MainLayout } from './layouts/MainLayout'
import { AdminLayout } from './layouts/AdminLayout'

// Consumer Pages
import { HomePage } from './pages/HomePage'
import { TutorSearchPage } from './pages/TutorSearchPage'
import { TutorDetailPage } from './pages/TutorDetailPage'
import { LoginPage } from './pages/LoginPage'
import { QuickLoginPage } from './pages/QuickLoginPage'
import { RegisterLearnerPage } from './pages/RegisterLearnerPage'
import { RegisterTutorPage } from './pages/RegisterTutorPage'
import { LearnerAccountPage } from './pages/LearnerAccountPage'
import { TutorStudioPage } from './pages/TutorStudioPage'
import { MessagesPage } from './pages/MessagesPage'
import { ReviewsPage } from './pages/ReviewsPage'

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { TutorVerificationsPage } from './pages/admin/TutorVerificationsPage'
import { CategoriesManagementPage } from './pages/admin/CategoriesManagementPage'
import { SubscriptionsManagementPage } from './pages/admin/SubscriptionsManagementPage'
import { SubscriptionPaymentsPage } from './pages/admin/SubscriptionPaymentsPage'
import { ReportsAnalyticsPage } from './pages/admin/ReportsAnalyticsPage'
import { PaymentReportsPage } from './pages/admin/PaymentReportsPage'
import { SubscriptionReportsPage } from './pages/admin/SubscriptionReportsPage'
import { UsersManagementPage } from './pages/admin/UsersManagementPage'
import { RolesMatrixPage } from './pages/admin/RolesMatrixPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { WireframeGallery } from './pages/WireFrameGallery'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public and Consumer Application Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/wireframes" element={<WireframeGallery />} />
              <Route path="/tutors" element={<TutorSearchPage />} />
              <Route path="/tutors/:id" element={<TutorDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/quick-login" element={<QuickLoginPage />} />
              <Route path="/dev-login" element={<Navigate to="/quick-login" replace />} />
              <Route path="/register/learner" element={<RegisterLearnerPage />} />
              <Route path="/register/tutor" element={<RegisterTutorPage />} />
              <Route path="/account" element={<LearnerAccountPage />} />
              <Route path="/tutor-studio" element={<TutorStudioPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
            </Route>

            {/* Backoffice Administration & IAM Governance Routes (Gated via AdminLayout PBAC) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="tutor-verifications" element={<TutorVerificationsPage />} />
              <Route path="categories" element={<CategoriesManagementPage />} />
              <Route path="subscriptions" element={<SubscriptionsManagementPage />} />
              <Route path="subscription-payments" element={<SubscriptionPaymentsPage />} />
              <Route path="reports" element={<ReportsAnalyticsPage />} />
              <Route path="reports/payments" element={<PaymentReportsPage />} />
              <Route path="reports/subscriptions" element={<SubscriptionReportsPage />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="roles" element={<RolesMatrixPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
