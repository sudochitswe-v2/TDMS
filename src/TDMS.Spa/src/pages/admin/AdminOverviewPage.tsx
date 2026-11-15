import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { MetricsGridSkeleton, LoadingSpinner } from '../../components/Loading'
import {
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingUp,
  Star,
  ShieldCheck,
  Sliders,
  BarChart3,
  CreditCard,
  Crown,
  ArrowRight
} from 'lucide-react'

interface ReportsSummary {
  summary: {
    totalUsers: number
    totalLearners: number
    totalTutors: number
    verifiedTutors: number
    pendingTutors: number
    totalInquiries: number
    acceptedInquiries: number
    totalReviews: number
  }
}

export const AdminOverviewPage: React.FC = () => {
  const { data, isLoading } = useQuery<ReportsSummary>({
    queryKey: ['adminOverviewReports'],
    queryFn: () => api.get('/api/operations/reports'),
  })

  const stats = data?.summary || {
    totalUsers: 0,
    totalLearners: 0,
    totalTutors: 0,
    verifiedTutors: 0,
    pendingTutors: 0,
    totalInquiries: 0,
    acceptedInquiries: 0,
    totalReviews: 0,
  }

  const tutorVerificationRate =
    stats.totalTutors > 0
      ? Math.round((stats.verifiedTutors / stats.totalTutors) * 100)
      : 0

  const inquiryConversionRate =
    stats.totalInquiries > 0
      ? Math.round((stats.acceptedInquiries / stats.totalInquiries) * 100)
      : 0

  return (
    <div className="space-y-8">
      {/* <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Governance & Operational Dashboard</h1>
      </div> */}

      {/* Metric Cards Grid */}
      {isLoading ? (
        <div className="space-y-4">
          <LoadingSpinner size="sm" text="Aggregating platform operational metrics..." center />
          <MetricsGridSkeleton count={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Accounts */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Accounts</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold">{stats.totalUsers}</p>
          <p className="text-[11px] text-muted-foreground">
            {stats.totalLearners} Learners &bull; {stats.totalTutors} Educators
          </p>
        </div>

        {/* Tutor Verifications Pending */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tutor Verifications</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold">{stats.pendingTutors}</p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{stats.verifiedTutors} Verified Active</span>
            {stats.pendingTutors > 0 && (
              <Link to="/admin/tutor-verifications" className="text-primary font-bold hover:underline">
                Review &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Tutor Verification Rate */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tutor Verification Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold">{tutorVerificationRate}%</p>
          <p className="text-[11px] text-muted-foreground">
            {stats.verifiedTutors} of {stats.totalTutors} educators verified
          </p>
        </div>

        {/* Total Inquiries */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Inquiries</span>
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <p className="text-3xl font-extrabold">{stats.totalInquiries}</p>
          <p className="text-[11px] text-muted-foreground">
            {stats.acceptedInquiries} Accepted Discussions
          </p>
        </div>

        {/* Inquiry Conversion Rate */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Inquiry Conversion</span>
            <TrendingUp className="h-4 w-4 text-teal-500" />
          </div>
          <p className="text-3xl font-extrabold">{inquiryConversionRate}%</p>
          <p className="text-[11px] text-muted-foreground">
            {stats.acceptedInquiries} of {stats.totalInquiries} inquiries accepted
          </p>
        </div>

          {/* Student Feedback */}
          <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Student Feedback</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold">{stats.totalReviews}</p>
            <p className="text-[11px] text-muted-foreground">Verified Star Ratings</p>
          </div>
        </div>
      )}
    </div>
  )
}
