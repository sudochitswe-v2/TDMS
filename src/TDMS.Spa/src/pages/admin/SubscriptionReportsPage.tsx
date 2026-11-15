import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { HasPermission } from '../../context/AuthContext'
import { Pagination } from '../../components/Pagination'
import { MetricsGridSkeleton, TableSkeleton } from '../../components/Loading'
import {
  Crown,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Search,
  RefreshCw,
  Zap,
  BookOpen,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Percent
} from 'lucide-react'

interface SubscriptionReportSummary {
  totalTutors: number
  verifiedTutors: number
  subscribedTutorsCount: number
  paidSubscribersCount: number
  freeTierTutorsCount: number
  expiringSoonCount: number
  expiredCount: number
  paidConversionRate: number
  totalSubscriptionRevenue: number
}

interface SubscriptionTierDistribution {
  packageId: number
  tierName: string
  displayFee: number
  durationDays: number
  maxActiveSubjects: number
  prioritySearchBoost: number
  isActive: boolean
  activeTutorsCount: number
  percentageOfTutors: number
  totalRevenueGenerated: number
}

interface TutorSubscriptionItem {
  tutorProfileId: string
  tutorName: string
  tutorEmail: string
  verificationStatus: string
  packageId?: number | null
  tierName: string
  displayFee: number
  durationDays: number
  subscriptionUpdatedAt?: string | null
  expiresAt?: string | null
  daysRemaining?: number | null
  status: 'Active' | 'ExpiringSoon' | 'Expired' | 'FreeTier'
  confirmedPaymentsCount: number
  totalSpent: number
}

interface SubscriptionReportResponse {
  summary: SubscriptionReportSummary
  tierDistribution: SubscriptionTierDistribution[]
  subscriptions: TutorSubscriptionItem[]
}

export const SubscriptionReportsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isFetching, refetch } = useQuery<SubscriptionReportResponse>({
    queryKey: ['adminSubscriptionReport'],
    queryFn: () => api.get<SubscriptionReportResponse>('/api/operations/reports/subscriptions'),
  })

  const summary = data?.summary || {
    totalTutors: 0,
    verifiedTutors: 0,
    subscribedTutorsCount: 0,
    paidSubscribersCount: 0,
    freeTierTutorsCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    paidConversionRate: 0,
    totalSubscriptionRevenue: 0,
  }

  const tierDistribution = data?.tierDistribution || []
  const allSubscriptions = data?.subscriptions || []

  // Filtered subscriptions list
  const filteredSubscriptions = useMemo(() => {
    return allSubscriptions.filter((s) => {
      const matchSearch =
        s.tutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tutorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tierName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchTier =
        tierFilter === 'all' ||
        (tierFilter === 'free' && (!s.packageId || s.displayFee === 0)) ||
        s.packageId?.toString() === tierFilter

      const matchStatus =
        statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase()

      return matchSearch && matchTier && matchStatus
    })
  }, [allSubscriptions, searchTerm, tierFilter, statusFilter])

  // Paginated slice
  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSubscriptions.slice(start, start + pageSize)
  }, [filteredSubscriptions, currentPage, pageSize])

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredSubscriptions.length === 0) return

    const headers = [
      'Tutor ID',
      'Tutor Name',
      'Tutor Email',
      'Verification Status',
      'Subscription Tier',
      'Fee (MMK)',
      'Duration (Days)',
      'Activated At',
      'Expires At',
      'Days Remaining',
      'Lifecycle Status',
      'Confirmed Payments Count',
      'Total Spent (MMK)',
    ]

    const rows = filteredSubscriptions.map((s) => [
      `"${s.tutorProfileId}"`,
      `"${s.tutorName.replace(/"/g, '""')}"`,
      `"${s.tutorEmail}"`,
      s.verificationStatus,
      `"${s.tierName.replace(/"/g, '""')}"`,
      s.displayFee,
      s.durationDays,
      `"${s.subscriptionUpdatedAt ? new Date(s.subscriptionUpdatedAt).toISOString() : ''}"`,
      `"${s.expiresAt ? new Date(s.expiresAt).toISOString() : ''}"`,
      s.daysRemaining !== null && s.daysRemaining !== undefined ? s.daysRemaining : '',
      s.status,
      s.confirmedPaymentsCount,
      s.totalSpent,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `tdms-subscriptions-report-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription & Tier Performance</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border bg-card text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition disabled:opacity-50"
            title="Refresh subscription data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </button>

          <HasPermission permission="reports:export">
            <button
              onClick={handleExportCSV}
              disabled={filteredSubscriptions.length === 0}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </HasPermission>
        </div>
      </div>


      {/* KPI Cards Grid */}
      {isLoading ? (
        <MetricsGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Paid Subscribers */}
          <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Active Paid Subscriptions</span>
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {summary.paidSubscribersCount}
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                {summary.paidConversionRate}% Adoption
              </span>
              <span>of {summary.totalTutors} educators</span>
            </div>
          </div>

          {/* Free / Starter Tutors */}
          <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Free Starter Tutors</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {summary.freeTierTutorsCount}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Educators on complimentary standard listing
            </p>
          </div>

          {/* Upcoming Renewals */}
          <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Expiring Within 7 Days</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {summary.expiringSoonCount}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {summary.expiredCount > 0
                ? `${summary.expiredCount} expired subscriptions logged`
                : 'All other active subscriptions healthy'}
            </p>
          </div>

          {/* Total Lifetime Subscription Revenue */}
          <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Subscription Revenue</span>
              <Zap className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {summary.totalSubscriptionRevenue.toLocaleString()}{' '}
              <span className="text-sm font-semibold text-muted-foreground">MMK</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Cumulative realized revenue</p>
          </div>
        </div>
      )}

      {/* Tier Adoption & Distribution Cards */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
          <div>
            <h2 className="font-bold text-base flex items-center space-x-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>Subscription Package Market Performance</span>
            </h2>
          </div>
          <Link
            to="/admin/subscriptions"
            className="text-xs font-semibold text-primary hover:underline flex items-center space-x-1"
          >
            <span>Manage Tier Packages</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Calculating tier distribution...</p>
        ) : tierDistribution.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No subscription packages found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tierDistribution.map((pkg) => (
              <div
                key={pkg.packageId}
                className="rounded-xl border p-4 bg-secondary/20 hover:bg-secondary/40 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center space-x-1.5">
                      <span>{pkg.tierName}</span>
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {pkg.displayFee.toLocaleString()} MMK{' '}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        / {pkg.durationDays > 0 ? `${pkg.durationDays} days` : 'Permanent'}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pkg.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {pkg.isActive ? 'Active Plan' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-1 border-y border-border/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Max Subjects</span>
                    <span className="font-semibold text-foreground flex items-center space-x-1">
                      <BookOpen className="w-3 h-3 text-primary" />
                      <span>{pkg.maxActiveSubjects} Subjects</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Search Boost</span>
                    <span className="font-semibold text-foreground flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>+{pkg.prioritySearchBoost} Priority</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Active Educators</span>
                    <span className="font-bold text-foreground">
                      {pkg.activeTutorsCount}{' '}
                      <span className="text-[10px] text-muted-foreground">({pkg.percentageOfTutors}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(pkg.percentageOfTutors, 2))}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
                  <span>Revenue Generated:</span>
                  <span className="font-bold text-foreground">
                    {pkg.totalRevenueGenerated.toLocaleString()} MMK
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribed Tutors Health & Directory Table */}
      <div className="rounded-2xl border bg-card shadow-sm space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="font-bold text-base flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Educator Subscription & Lifecycles</span>
            </h2>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search educator or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs px-3 py-1.5 rounded-xl border bg-background text-foreground focus:outline-hidden"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free Starter Tier</option>
              {tierDistribution.map((t) => (
                <option key={t.packageId} value={t.packageId.toString()}>
                  {t.tierName}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs px-3 py-1.5 rounded-xl border bg-background text-foreground focus:outline-hidden"
            >
              <option value="all">All Lifecycles</option>
              <option value="active">Active Plan</option>
              <option value="expiringsoon">Expiring Soon (≤ 7 Days)</option>
              <option value="expired">Expired</option>
              <option value="freetier">Free Tier</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground border-b font-medium">
              <tr>
                <th className="py-3 px-4">Educator</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Current Tier</th>
                <th className="py-3 px-4">Plan Fee</th>
                <th className="py-3 px-4">Activated On</th>
                <th className="py-3 px-4">Expiration / Countdown</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4 text-right">Lifetime Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton rows={5} cols={8} message="Loading subscription directory..." />
              ) : paginatedSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No subscriptions match current filters.
                  </td>
                </tr>
              ) : (
                paginatedSubscriptions.map((s) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground border">
                      Free Starter
                    </span>
                  )
                  if (s.status === 'Active') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Active
                      </span>
                    )
                  } else if (s.status === 'ExpiringSoon') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center w-fit space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Expiring Soon</span>
                      </span>
                    )
                  } else if (s.status === 'Expired') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                        Expired
                      </span>
                    )
                  }

                  return (
                    <tr key={s.tutorProfileId} className="hover:bg-secondary/20 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{s.tutorName}</div>
                        <div className="text-[10px] text-muted-foreground">{s.tutorEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.verificationStatus === 'Verified'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : s.verificationStatus === 'Pending'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {s.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-semibold text-[11px]">
                          {s.tierName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-foreground">
                          {s.displayFee > 0 ? `${s.displayFee.toLocaleString()} MMK` : 'Free'}
                        </span>
                        {s.durationDays > 0 && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({s.durationDays}d)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {s.subscriptionUpdatedAt
                          ? new Date(s.subscriptionUpdatedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {s.daysRemaining !== null && s.daysRemaining !== undefined ? (
                          s.daysRemaining > 0 ? (
                            <span
                              className={`font-medium ${s.daysRemaining <= 7 ? 'text-amber-500 font-bold' : 'text-foreground'
                                }`}
                            >
                              {s.daysRemaining} days left
                            </span>
                          ) : (
                            <span className="text-destructive font-bold">
                              Expired {Math.abs(s.daysRemaining)} days ago
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">Indefinite</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{statusBadge}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-extrabold text-foreground">
                          {s.totalSpent.toLocaleString()} MMK
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          {s.confirmedPaymentsCount} payment{s.confirmedPaymentsCount !== 1 ? 's' : ''}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredSubscriptions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSubscriptions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="educator subscriptions"
          />
        )}
      </div>
    </div>
  )
}
