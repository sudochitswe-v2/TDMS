import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import { Pagination } from '../../components/Pagination'
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  AlertCircle,
  ShieldAlert,
  Receipt,
  Eye,
  X,
  FileCheck,
  User,
  ArrowRight
} from 'lucide-react'

interface SubscriptionPaymentRecord {
  id: number
  tutorProfileId: string
  tutorName: string
  tutorEmail: string
  currentTier: string
  packageId: number
  packageName: string
  packageFee: number
  durationDays: number
  amount: number
  paymentMethod: string
  transactionLast6: string
  screenshotUrl: string
  notes?: string | null
  status: 'Pending' | 'Confirmed' | 'Rejected'
  rejectionReason?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt: string
}

export const SubscriptionPaymentsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'pending' | 'confirmed' | 'rejected' | 'all'>('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Rejection modal state
  const [rejectingPaymentId, setRejectingPaymentId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Screenshot preview modal state
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null)

  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const { data: payments = [], isLoading } = useQuery<SubscriptionPaymentRecord[]>({
    queryKey: ['adminSubscriptionPayments', statusFilter],
    queryFn: () => api.get<SubscriptionPaymentRecord[]>(`/api/operations/subscriptions/payments?status=${statusFilter}`),
  })

  const confirmMutation = useMutation({
    mutationFn: (paymentId: number) =>
      api.put(`/api/operations/subscriptions/payments/${paymentId}/confirm`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptionPayments'] })
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] })
      setActionSuccess(data?.message || 'Payment confirmed and subscription activated successfully!')
      setActionError(null)
    },
    onError: (err: ApiError) => {
      setActionError(err.message || 'Failed to confirm payment')
      setActionSuccess(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) =>
      api.put(`/api/operations/subscriptions/payments/${paymentId}/reject`, {
        rejectionReason: reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptionPayments'] })
      setActionSuccess('Payment rejected and feedback sent to tutor.')
      setActionError(null)
      setRejectingPaymentId(null)
      setRejectionReason('')
    },
    onError: (err: ApiError) => {
      setActionError(err.message || 'Failed to reject payment')
      setActionSuccess(null)
    },
  })

  const handleConfirm = (paymentId: number) => {
    setActionError(null)
    setActionSuccess(null)
    confirmMutation.mutate(paymentId)
  }

  const handleOpenRejectModal = (paymentId: number) => {
    setRejectingPaymentId(paymentId)
    setRejectionReason('')
    setActionError(null)
    setActionSuccess(null)
  }

  const handleConfirmReject = () => {
    if (!rejectingPaymentId) return
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason explaining why the payment proof was rejected.')
      return
    }
    rejectMutation.mutate({
      paymentId: rejectingPaymentId,
      reason: rejectionReason.trim(),
    })
  }

  const filtered = payments.filter((p) => {
    const q = searchTerm.toLowerCase()
    return (
      p.tutorName?.toLowerCase().includes(q) ||
      p.tutorEmail?.toLowerCase().includes(q) ||
      p.packageName?.toLowerCase().includes(q) ||
      p.paymentMethod?.toLowerCase().includes(q) ||
      p.transactionLast6?.toLowerCase().includes(q)
    )
  })

  const paginatedPayments = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center space-x-2">
            <Receipt className="h-6 w-6 text-primary" />
            <span>Tutor Subscription Payment Verifications</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify manual third-party payment receipts (KBZPay, WavePay, AYA Pay, Bank Transfer) and activate tier subscriptions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {payments.length} in View
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-xs font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-secondary/40 border w-fit">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'confirmed'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Payments
          </button>
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by tutor, package, method, or Trx ID..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          Loading subscription payment proofs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border bg-card space-y-3">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-base">No Payments Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            There are currently no subscription payment submissions matching your active filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {paginatedPayments.map((payment) => (
            <div key={payment.id} className="p-6 rounded-2xl border bg-card shadow-sm space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-bold">{payment.tutorName}</h2>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        payment.status === 'Confirmed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : payment.status === 'Rejected'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {payment.status === 'Confirmed'
                        ? 'Confirmed & Active'
                        : payment.status === 'Rejected'
                        ? 'Rejected'
                        : 'Pending Verification'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{payment.tutorEmail}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current Active Tier: <span className="font-semibold text-foreground">{payment.currentTier}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0 self-end sm:self-start">
                  {payment.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleConfirm(payment.id)}
                        disabled={confirmMutation.isPending}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm & Activate</span>
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(payment.id)}
                        disabled={rejectMutation.isPending}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {payment.status === 'Rejected' && (
                    <button
                      onClick={() => handleConfirm(payment.id)}
                      disabled={confirmMutation.isPending}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Re-evaluate & Confirm</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Payment & Package Meta Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-secondary/40 space-y-1">
                  <span className="text-muted-foreground font-medium">Requested Plan</span>
                  <p className="text-sm font-bold text-primary">{payment.packageName}</p>
                  <span className="text-[10px] text-muted-foreground">{payment.durationDays} Days Duration</span>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/40 space-y-1">
                  <span className="text-muted-foreground font-medium">Transfer Amount</span>
                  <p className="text-base font-extrabold text-foreground">{payment.amount.toLocaleString()} MMK</p>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/40 space-y-1">
                  <span className="text-muted-foreground font-medium">Payment Method</span>
                  <p className="text-sm font-bold text-foreground">{payment.paymentMethod}</p>
                  <span className="text-[10px] text-muted-foreground">Mobile / Third-Party</span>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/40 space-y-1">
                  <span className="text-muted-foreground font-medium">Transaction ID (Last 6)</span>
                  <p className="text-base font-mono font-bold text-foreground tracking-wider">
                    ...{payment.transactionLast6}
                  </p>
                </div>
              </div>

              {/* Notes / Optional description */}
              {payment.notes && (
                <div className="text-xs p-3 rounded-xl border bg-secondary/20 space-y-1">
                  <span className="font-semibold text-muted-foreground">Tutor Submission Note:</span>
                  <p className="text-foreground leading-relaxed">{payment.notes}</p>
                </div>
              )}

              {/* Rejection Note if Rejected */}
              {payment.status === 'Rejected' && payment.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Rejection Reason Sent to Tutor</span>
                  </div>
                  <p className="text-foreground/90">{payment.rejectionReason}</p>
                </div>
              )}

              {/* Payment Proof Receipt Screenshot */}
              <div className="border-t pt-4 text-xs space-y-2">
                <span className="font-semibold text-muted-foreground flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-primary" />
                  <span>Attached Transaction Receipt Screenshot</span>
                </span>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                  <div
                    onClick={() => setPreviewScreenshotUrl(payment.screenshotUrl)}
                    className="relative group cursor-pointer border rounded-xl overflow-hidden shadow-xs hover:border-primary/50 transition"
                  >
                    <img
                      src={payment.screenshotUrl}
                      alt={`Receipt ${payment.transactionLast6}`}
                      className="w-36 h-28 object-cover bg-secondary"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-semibold space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>View Full</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-muted-foreground">
                      Submitted on: <span className="font-medium text-foreground">{new Date(payment.createdAt).toLocaleString()}</span>
                    </p>
                    {payment.reviewedAt && (
                      <p className="text-muted-foreground">
                        Reviewed: <span className="font-medium text-foreground">{new Date(payment.reviewedAt).toLocaleString()}</span>
                        {payment.reviewedBy && <span> by <strong className="text-foreground">{payment.reviewedBy}</strong></span>}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewScreenshotUrl(payment.screenshotUrl)}
                      className="text-primary hover:underline text-xs flex items-center space-x-1 font-semibold cursor-pointer pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Screenshot in Full Size</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          <div className="p-4 rounded-2xl border bg-card shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="payment submissions"
              className="pt-0 border-t-0"
            />
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base">Reject Subscription Payment</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Please specify why this payment proof could not be verified. The tutor will see this explanation in their subscription dashboard.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Transaction ID was not found in our KBZPay merchant statement, or amount transferred was less than 35,000 MMK."
              rows={4}
              className="w-full p-3 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-destructive/50"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setRejectingPaymentId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Full Preview Modal */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="relative max-w-2xl w-full bg-card rounded-2xl p-4 border shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Receipt className="h-4 w-4 text-primary" />
                <span>Payment Transfer Receipt Screenshot</span>
              </h3>
              <button
                onClick={() => setPreviewScreenshotUrl(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-secondary/30 rounded-xl p-2">
              <img
                src={previewScreenshotUrl}
                alt="Payment proof full"
                className="max-h-[70vh] object-contain rounded-lg border shadow-sm"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <a
                href={previewScreenshotUrl}
                download="payment_proof_receipt"
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border hover:bg-secondary text-primary flex items-center space-x-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Download Slip</span>
              </a>
              <button
                onClick={() => setPreviewScreenshotUrl(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
