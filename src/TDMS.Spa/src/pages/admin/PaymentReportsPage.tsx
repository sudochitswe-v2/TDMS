import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { HasPermission } from '../../context/AuthContext'
import { Pagination } from '../../components/Pagination'
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Search,
  RefreshCw,
  ExternalLink,
  Eye,
  X,
  Wallet,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'

interface PaymentReportSummary {
  totalRevenue: number
  confirmedCount: number
  pendingRevenue: number
  pendingCount: number
  rejectedRevenue: number
  rejectedCount: number
  totalTransactions: number
  averageTransactionValue: number
  confirmationRate: number
}

interface PaymentMethodBreakdown {
  method: string
  totalAmount: number
  confirmedAmount: number
  totalCount: number
  confirmedCount: number
  sharePercentage: number
}

interface PaymentPackageBreakdown {
  packageId: number
  packageName: string
  displayFee: number
  confirmedAmount: number
  confirmedCount: number
  totalCount: number
}

interface PaymentMonthlyTrend {
  period: string
  label: string
  revenue: number
  confirmedCount: number
  totalCount: number
}

interface PaymentReportItem {
  id: number
  tutorProfileId: string
  tutorName: string
  tutorEmail: string
  packageId: number
  packageName: string
  amount: number
  paymentMethod: string
  transactionLast6: string
  screenshotUrl: string
  notes?: string | null
  status: 'Confirmed' | 'Pending' | 'Rejected'
  rejectionReason?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt: string
}

interface PaymentReportResponse {
  summary: PaymentReportSummary
  methods: PaymentMethodBreakdown[]
  packages: PaymentPackageBreakdown[]
  monthlyTrends: PaymentMonthlyTrend[]
  payments: PaymentReportItem[]
}

export const PaymentReportsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal state for viewing receipt slip & transaction audit
  const [selectedPayment, setSelectedPayment] = useState<PaymentReportItem | null>(null)

  const { data, isLoading, isFetching, refetch } = useQuery<PaymentReportResponse>({
    queryKey: ['adminPaymentReport'],
    queryFn: () => api.get<PaymentReportResponse>('/api/operations/reports/payments'),
  })

  const summary = data?.summary || {
    totalRevenue: 0,
    confirmedCount: 0,
    pendingRevenue: 0,
    pendingCount: 0,
    rejectedRevenue: 0,
    rejectedCount: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    confirmationRate: 0,
  }

  const methods = data?.methods || []
  const packages = data?.packages || []
  const allPayments = data?.payments || []

  // Filtered payments list based on search, status, and method
  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      const matchSearch =
        p.tutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tutorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionLast6.includes(searchTerm) ||
        p.packageName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchStatus =
        statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase()

      const matchMethod =
        methodFilter === 'all' || p.paymentMethod.toLowerCase() === methodFilter.toLowerCase()

      return matchSearch && matchStatus && matchMethod
    })
  }, [allPayments, searchTerm, statusFilter, methodFilter])

  // Paginated slice
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPayments.slice(start, start + pageSize)
  }, [filteredPayments, currentPage, pageSize])

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return

    const headers = [
      'ID',
      'Transaction Last 6',
      'Tutor Name',
      'Tutor Email',
      'Subscription Tier',
      'Amount (MMK)',
      'Payment Method',
      'Status',
      'Created Date',
      'Reviewed By',
      'Reviewed Date',
      'Rejection Reason',
    ]

    const rows = filteredPayments.map((p) => [
      p.id,
      `"${p.transactionLast6}"`,
      `"${p.tutorName.replace(/"/g, '""')}"`,
      `"${p.tutorEmail}"`,
      `"${p.packageName.replace(/"/g, '""')}"`,
      p.amount,
      `"${p.paymentMethod}"`,
      p.status,
      `"${new Date(p.createdAt).toISOString()}"`,
      `"${p.reviewedBy ? p.reviewedBy.replace(/"/g, '""') : ''}"`,
      `"${p.reviewedAt ? new Date(p.reviewedAt).toISOString() : ''}"`,
      `"${p.rejectionReason ? p.rejectionReason.replace(/"/g, '""') : ''}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `tdms-payments-report-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment & Revenue Intelligence</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border bg-card text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition disabled:opacity-50"
            title="Refresh payment data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </button>

          <HasPermission permission="reports:export">
            <button
              onClick={handleExportCSV}
              disabled={filteredPayments.length === 0}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </HasPermission>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Realized Revenue */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Realized Gross Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {summary.totalRevenue.toLocaleString()}{' '}
            <span className="text-sm font-semibold text-muted-foreground">MMK</span>
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
              {summary.confirmedCount} Confirmed
            </span>
            <span>from verified settlements</span>
          </div>
        </div>

        {/* Pending Clearance */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pending Verification</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {summary.pendingRevenue.toLocaleString()}{' '}
            <span className="text-sm font-semibold text-muted-foreground">MMK</span>
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{summary.pendingCount} Slips in Queue</span>
            {summary.pendingCount > 0 && (
              <Link
                to="/admin/subscription-payments"
                className="text-primary font-bold hover:underline flex items-center space-x-0.5"
              >
                <span>Verify</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Payment Confirmation Rate */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Confirmation Rate</span>
            <CheckCircle className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {summary.confirmationRate}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            {summary.confirmedCount} of {summary.totalTransactions} transactions approved
            {summary.rejectedCount > 0 && ` (${summary.rejectedCount} rejected)`}
          </p>
        </div>

        {/* Average Order Value */}
        <div className="p-5 rounded-2xl border bg-card space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Avg. Order Value</span>
            <TrendingUp className="h-4 w-4 text-teal-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {summary.averageTransactionValue.toLocaleString()}{' '}
            <span className="text-sm font-semibold text-muted-foreground">MMK</span>
          </p>
          <p className="text-[11px] text-muted-foreground">Per confirmed tier subscription</p>
        </div>
      </div>

      {/* Visual Analytics Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm">Settlement Channel Distribution</h2>
            </div>
            <span className="text-xs text-muted-foreground">{methods.length} Payment Gateways</span>
          </div>

          {isLoading ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Loading channel statistics...</p>
          ) : methods.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No payment data recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {methods.map((m) => (
                <div key={m.method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-foreground">{m.method}</span>
                      <span className="text-muted-foreground">
                        ({m.confirmedCount} confirmed / {m.totalCount} total)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">
                        {m.confirmedAmount.toLocaleString()} MMK
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">
                        ({m.sharePercentage}%)
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(m.sharePercentage, 3))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Subscription Package */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <h2 className="font-bold text-sm">Revenue by Subscription Tier</h2>
            </div>
            <span className="text-xs text-muted-foreground">{packages.length} Packages</span>
          </div>

          {isLoading ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Loading tier breakdown...</p>
          ) : packages.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No package revenue recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.packageId}
                  className="flex items-center justify-between p-3 rounded-xl border bg-secondary/30 hover:bg-secondary/50 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-foreground">{pkg.packageName}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                        {pkg.displayFee.toLocaleString()} MMK
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {pkg.confirmedCount} confirmed subscriptions ({pkg.totalCount} total orders)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-foreground">
                      {pkg.confirmedAmount.toLocaleString()} MMK
                    </p>
                    <p className="text-[10px] text-muted-foreground">Total Realized</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Transactions Audit Table Card */}
      <div className="rounded-2xl border bg-card shadow-sm space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="font-bold text-base flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-primary" />
              <span>Audited Payment Records</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive transaction log with settlement proofs and verification audit trails
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tutor, email, ref..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs px-3 py-1.5 rounded-xl border bg-background text-foreground focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs px-3 py-1.5 rounded-xl border bg-background text-foreground focus:outline-hidden"
            >
              <option value="all">All Gateways</option>
              <option value="kbzpay">KBZPay</option>
              <option value="wavepay">WavePay</option>
              <option value="ayapay">AYAPay</option>
              <option value="cbpay">CBPay</option>
              <option value="banktransfer">BankTransfer</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground border-b font-medium">
              <tr>
                <th className="py-3 px-4">Ref / Tx ID</th>
                <th className="py-3 px-4">Educator</th>
                <th className="py-3 px-4">Subscription Tier</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Gateway</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Loading payment audit log...
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No payment records match current filters.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Pending
                    </span>
                  )
                  if (p.status === 'Confirmed') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Confirmed
                      </span>
                    )
                  } else if (p.status === 'Rejected') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                        Rejected
                      </span>
                    )
                  }

                  return (
                    <tr key={p.id} className="hover:bg-secondary/20 transition">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        #{p.id} &bull; <span className="text-primary">{p.transactionLast6}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{p.tutorName}</div>
                        <div className="text-[10px] text-muted-foreground">{p.tutorEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-medium text-[11px]">
                          {p.packageName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-foreground">
                          {p.amount.toLocaleString()} MMK
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{p.paymentMethod}</span>
                      </td>
                      <td className="py-3 px-4">{statusBadge}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}{' '}
                        <span className="text-[10px]">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border bg-card hover:bg-secondary text-[11px] font-medium transition"
                          title="View transaction audit slip"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPayments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPayments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="payment transactions"
          />
        )}
      </div>

      {/* Slip & Transaction Audit Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">Transaction Audit #{selectedPayment.id}</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Screenshot Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Payment Proof Slip</label>
              <div className="rounded-xl border bg-secondary/30 p-2 flex justify-center items-center">
                {selectedPayment.screenshotUrl ? (
                  <img
                    src={selectedPayment.screenshotUrl}
                    alt="Payment receipt proof"
                    className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground py-8">No receipt screenshot attached</p>
                )}
              </div>
            </div>

            {/* Transaction Data Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-secondary/20 p-3 rounded-xl border">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Educator</span>
                <span className="font-semibold text-foreground">{selectedPayment.tutorName}</span>
                <span className="block text-[10px] text-muted-foreground">{selectedPayment.tutorEmail}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Package Tier</span>
                <span className="font-semibold text-foreground">{selectedPayment.packageName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Amount Paid</span>
                <span className="font-bold text-foreground text-sm">
                  {selectedPayment.amount.toLocaleString()} MMK
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Settlement Channel</span>
                <span className="font-semibold text-foreground">{selectedPayment.paymentMethod}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Ref / Last 6 Digits</span>
                <span className="font-mono font-bold text-primary">{selectedPayment.transactionLast6}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Current Status</span>
                <span className="font-bold text-foreground">{selectedPayment.status}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedPayment.notes && (
              <div className="text-xs space-y-1 bg-secondary/30 p-3 rounded-xl border">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Tutor Notes</span>
                <p className="text-foreground">{selectedPayment.notes}</p>
              </div>
            )}

            {/* Audit Review Details */}
            {selectedPayment.reviewedBy && (
              <div className="text-xs space-y-1 bg-secondary/30 p-3 rounded-xl border">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Reviewer Log</span>
                <p className="text-foreground">
                  Reviewed by <span className="font-semibold">{selectedPayment.reviewedBy}</span> on{' '}
                  {selectedPayment.reviewedAt ? new Date(selectedPayment.reviewedAt).toLocaleString() : 'N/A'}
                </p>
                {selectedPayment.rejectionReason && (
                  <p className="text-destructive font-medium mt-1">
                    Reason: {selectedPayment.rejectionReason}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-xl border bg-card text-xs font-semibold hover:bg-secondary transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
