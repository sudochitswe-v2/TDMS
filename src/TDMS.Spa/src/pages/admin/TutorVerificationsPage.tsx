import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import { formatFileSize } from '../../lib/formatters'
import { Pagination } from '../../components/Pagination'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Search,
  ExternalLink,
  GraduationCap,
  User,
  ShieldAlert,
  ShieldCheck,
  FileCheck
} from 'lucide-react'

interface PendingTutor {
  id: string
  userId: string
  fullName: string
  email: string
  headline: string | null
  biography: string | null
  yearsOfExperience: number
  hourlyFee: number
  teachingMode: string
  verificationStatus: string
  rejectionReason: string | null
  profilePictureUrl: string | null
  createdAt: string
  categories: string[]
  documents: Array<{
    id: number | string
    documentType: string
    fileName?: string
    fileUrl: string
    fileSizeBytes?: number
    uploadedAt: string
  }>
}

export const TutorVerificationsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'pending' | 'rejected' | 'all'>('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [rejectingTutorId, setRejectingTutorId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const { data: tutors = [], isLoading } = useQuery<PendingTutor[]>({
    queryKey: ['tutorsForVerification', statusFilter],
    queryFn: () => api.get<PendingTutor[]>(`/api/operations/tutors/pending?status=${statusFilter}`),
  })

  const verifyMutation = useMutation({
    mutationFn: ({ tutorId, decision, reason }: { tutorId: string; decision: string; reason?: string }) =>
      api.put(`/api/operations/tutors/${tutorId}/verify`, {
        decision,
        rejectionReason: reason,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tutorsForVerification'] })
      queryClient.invalidateQueries({ queryKey: ['adminOverviewReports'] })
      setActionSuccess(`Tutor marked as ${variables.decision} successfully.`)
      setActionError(null)
      setRejectingTutorId(null)
      setRejectionReason('')
    },
    onError: (err: ApiError) => {
      setActionError(err.message || 'Verification update failed')
      setActionSuccess(null)
    },
  })

  const handleApprove = (tutorId: string) => {
    setActionError(null)
    setActionSuccess(null)
    verifyMutation.mutate({ tutorId, decision: 'Verified' })
  }

  const handleOpenRejectModal = (tutorId: string) => {
    setRejectingTutorId(tutorId)
    setRejectionReason('')
    setActionError(null)
    setActionSuccess(null)
  }

  const handleConfirmReject = () => {
    if (!rejectingTutorId) return
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason for rejecting the tutor verification.')
      return
    }
    verifyMutation.mutate({
      tutorId: rejectingTutorId,
      decision: 'Rejected',
      reason: rejectionReason.trim(),
    })
  }

  const filtered = tutors.filter((t) => {
    const q = searchTerm.toLowerCase()
    return (
      t.fullName?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.headline?.toLowerCase().includes(q) ||
      t.categories.some((c) => c.toLowerCase().includes(q))
    )
  })

  const paginatedTutors = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutor Credential Verifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review educator profile pictures, academic degrees, and proof of tutoring work before marketplace publishing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {tutors.length} in View
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-secondary/40 border w-fit">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              statusFilter === 'pending'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              statusFilter === 'rejected'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              statusFilter === 'all'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Applications
          </button>
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search applicants by name, email, subject..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          Loading verification applications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border bg-card space-y-3">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-base">No Applications Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            There are currently no tutor applications matching your selected status and search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {paginatedTutors.map((tutor) => (
            <div key={tutor.id} className="p-6 rounded-2xl border bg-card shadow-sm space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {tutor.profilePictureUrl ? (
                      <img
                        src={tutor.profilePictureUrl}
                        alt={tutor.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center font-bold text-muted-foreground border">
                        {tutor.fullName?.slice(0, 2).toUpperCase() || 'TU'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-bold">{tutor.fullName}</h2>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          tutor.verificationStatus === 'Verified'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : tutor.verificationStatus === 'Rejected'
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {tutor.verificationStatus === 'Verified'
                          ? 'Verified'
                          : tutor.verificationStatus === 'Rejected'
                          ? 'Rejected'
                          : 'Pending Review'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tutor.email}</p>
                    <p className="text-sm font-medium text-primary mt-1">{tutor.headline || 'Independent Educator'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => handleApprove(tutor.id)}
                    disabled={verifyMutation.isPending}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Publish</span>
                  </button>
                  {tutor.verificationStatus !== 'Rejected' && (
                    <button
                      onClick={() => handleOpenRejectModal(tutor.id)}
                      disabled={verifyMutation.isPending}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection Note if Rejected */}
              {tutor.verificationStatus === 'Rejected' && tutor.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Previous Rejection Reason</span>
                  </div>
                  <p className="text-foreground/90">{tutor.rejectionReason}</p>
                </div>
              )}

              {/* Bio & Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
                  <span className="text-muted-foreground font-medium">Hourly Fee</span>
                  <p className="text-base font-bold text-foreground">{tutor.hourlyFee.toLocaleString()} MMK / hr</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
                  <span className="text-muted-foreground font-medium">Experience</span>
                  <p className="text-base font-bold text-foreground">{tutor.yearsOfExperience} years</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
                  <span className="text-muted-foreground font-medium">Teaching Mode</span>
                  <p className="text-base font-bold text-foreground capitalize">{tutor.teachingMode}</p>
                </div>
              </div>

              {tutor.biography && (
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-muted-foreground">Biography</span>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line bg-secondary/20 p-3 rounded-xl border">
                    {tutor.biography}
                  </p>
                </div>
              )}

              {/* Subject Categories */}
              {tutor.categories.length > 0 && (
                <div className="text-xs space-y-1.5">
                  <span className="font-semibold text-muted-foreground">Taught Subjects</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tutor.categories.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Documents */}
              <div className="text-xs space-y-2 border-t pt-4">
                <span className="font-semibold text-muted-foreground flex items-center space-x-1.5">
                  <FileCheck className="w-4 h-4 text-primary" />
                  <span>Submitted Academic & Tutoring Proof Documents ({tutor.documents.length})</span>
                </span>
                {tutor.documents.length === 0 ? (
                  <p className="text-muted-foreground italic">No document files attached with this application.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tutor.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border bg-secondary/30 flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 truncate pr-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {doc.documentType === 'AcademicCertificate' ? 'Academic Degree' :
                               doc.documentType === 'TutoringProof' ? 'Tutoring Proof' :
                               doc.documentType === 'ProfessionalLicense' ? 'Teaching License' :
                               doc.documentType === 'IdentityDocument' ? 'Identity ID' : doc.documentType}
                            </span>
                            {doc.fileSizeBytes ? (
                              <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.fileSizeBytes)}</span>
                            ) : null}
                          </div>
                          <p className="font-semibold text-foreground text-xs truncate mt-1">
                            {doc.fileName || `${doc.documentType} Document`}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={doc.fileUrl}
                          download={doc.fileName || `doc_${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-2 rounded-lg border hover:bg-secondary text-primary transition flex items-center space-x-1"
                          title="View or Download Document"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
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
              itemLabel="tutor applications"
              className="pt-0 border-t-0"
            />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingTutorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base">Reject Tutor Application</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Please state why this application does not satisfy verification standards. The educator will receive this feedback to update their credentials and re-submit.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Academic certificate is unclear; please provide a high-resolution scan of your Bachelor's degree and proof of tutoring experience."
              rows={4}
              className="w-full p-3 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-destructive/50"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setRejectingTutorId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={verifyMutation.isPending || !rejectionReason.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
