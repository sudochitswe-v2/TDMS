import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import {
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Sliders,
  FolderTree,
  CreditCard
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Governance & Operational Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-1">
          System-wide marketplace analytics, tutor credential verifications, and access control governance
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border bg-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Accounts</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold">{stats.totalUsers}</p>
          <p className="text-[11px] text-muted-foreground">
            {stats.totalLearners} Learners • {stats.totalTutors} Educators
          </p>
        </div>

        <div className="p-5 rounded-2xl border bg-card space-y-2">
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

        <div className="p-5 rounded-2xl border bg-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Inquiries</span>
            <MessageSquare className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold">{stats.totalInquiries}</p>
          <p className="text-[11px] text-muted-foreground">
            {stats.acceptedInquiries} Accepted Discussions
          </p>
        </div>

        <div className="p-5 rounded-2xl border bg-card space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Student Feedback</span>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold">{stats.totalReviews}</p>
          <p className="text-[11px] text-muted-foreground">Verified Star Ratings</p>
        </div>
      </div>

      {/* Quick Access Control Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/tutor-verifications"
          className="p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md transition space-y-2"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 w-fit">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base">Tutor Verifications</h3>
          <p className="text-xs text-muted-foreground">
            Inspect uploaded ID documents and certificates to approve or reject freelance educators.
          </p>
        </Link>

        <Link
          to="/admin/roles"
          className="p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md transition space-y-2"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 w-fit">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base">PBAC Claims & Roles Matrix</h3>
          <p className="text-xs text-muted-foreground">
            Configure permission checkboxes for all API action gates and UI menu claims.
          </p>
        </Link>

        <Link
          to="/admin/settings"
          className="p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md transition space-y-2"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
            <Sliders className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base">Algorithm Matching Weights</h3>
          <p className="text-xs text-muted-foreground">
            Adjust subject, fee linear decay, schedule slot, and mode weights totaling 100%.
          </p>
        </Link>
      </div>
    </div>
  )
}
