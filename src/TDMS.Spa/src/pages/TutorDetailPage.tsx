import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatTimeAmPm } from '../lib/formatters'
import { useAuth } from '../context/AuthContext'
import { Pagination } from '../components/Pagination'
import {
  ShieldCheck,
  Star,
  Clock,
  BookOpen,
  Send,
  Calendar,
  CheckCircle2,
  X,
  GraduationCap,
  Lock
} from 'lucide-react'

interface TutorDetail {
  id: string
  userId: string
  fullName: string
  email: string
  headline?: string
  biography?: string
  yearsOfExperience: number
  hourlyFee: number
  teachingMode: string
  verificationStatus: string
  profilePictureUrl?: string | null
  averageRating: number
  totalReviewsCount: number
  isPublished: boolean
  tierName?: string
  categories: { categoryId: number; name: string; gradeLevelTarget?: string }[]
  scheduleSlots: { dayOfWeek: number; startTime: string; endTime: string }[]
  ratingBreakdown?: Record<number, number>
  recentReviews: { id: string; learnerUserId?: string; learnerName: string; starRating: number; comment?: string | null; createdAt: string }[]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const TutorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('')
  const [requirementSummary, setRequirementSummary] = useState('')
  const [inquirySubmitting, setInquirySubmitting] = useState(false)
  const [inquirySuccess, setInquirySuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Write Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('')
  const [reviewErrorMessage, setReviewErrorMessage] = useState('')
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsPageSize, setReviewsPageSize] = useState(3)

  const { data: tutor, isLoading } = useQuery<TutorDetail>({
    queryKey: ['tutorDetail', id],
    queryFn: () => api.get(`/api/tutors/${id}`),
    enabled: !!id,
  })

  const handleOpenReviewModal = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setReviewRating(5)
    setReviewComment('')
    setReviewErrorMessage('')
    setReviewModalOpen(true)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewComment.trim()) {
      setReviewErrorMessage('Please provide a comment sharing your feedback.')
      return
    }

    setReviewSubmitting(true)
    setReviewErrorMessage('')
    try {
      await api.post(`/api/tutors/${id}/reviews`, {
        starRating: reviewRating,
        comment: reviewComment.trim(),
      })
      queryClient.invalidateQueries({ queryKey: ['tutorDetail', id] })
      queryClient.invalidateQueries({ queryKey: ['myReviews'] })
      setReviewSuccessMessage('Thank you! Your review has been published.')
      setReviewModalOpen(false)
      setTimeout(() => setReviewSuccessMessage(''), 4000)
    } catch (err: any) {
      setReviewErrorMessage(err.message || 'Failed to submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!selectedCategoryId || !requirementSummary.trim()) {
      setErrorMessage('Please select a subject category and describe your requirements.')
      return
    }

    setInquirySubmitting(true)
    setErrorMessage('')

    try {
      await api.post('/api/inquiries', {
        tutorProfileId: tutor?.id,
        categoryId: Number(selectedCategoryId),
        initialRequirementSummary: requirementSummary.trim(),
      })

      setInquirySuccess(true)
      setTimeout(() => {
        setInquiryModalOpen(false)
        navigate('/messages')
      }, 1500)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit inquiry')
    } finally {
      setInquirySubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-sm text-muted-foreground">
        Loading tutor profile details...
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Tutor Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested tutor profile could not be located.</p>
      </div>
    )
  }

  const existingUserReview = tutor.recentReviews?.find((r) => r.learnerUserId === user?.userId)
  const isOwnProfile = user?.userId === tutor.userId

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      {/* Profile Header Card */}
      <div className="p-8 rounded-3xl border bg-card shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
          {/* Tutor Avatar */}
          <div className="shrink-0">
            {tutor.profilePictureUrl ? (
              <img
                src={tutor.profilePictureUrl}
                alt={tutor.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-secondary flex items-center justify-center font-bold text-xl text-muted-foreground border">
                {tutor.fullName?.slice(0, 2).toUpperCase() || 'TU'}
              </div>
            )}
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">{tutor.fullName}</h1>
              <span className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Educator</span>
              </span>
              {tutor.tierName && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {tutor.tierName}
                </span>
              )}
            </div>

            <p className="text-base text-muted-foreground font-medium">
              {tutor.headline || 'Passionate Freelance Educator'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span>• {tutor.yearsOfExperience} Years Experience</span>
              <span>• Mode: {tutor.teachingMode}</span>
              <div className="flex items-center space-x-1 text-amber-500 font-semibold">
                <Star className="h-4 w-4 fill-current" />
                <span>{tutor.averageRating > 0 ? tutor.averageRating.toFixed(2) : 'No reviews yet'}</span>
                <span className="text-muted-foreground">({tutor.totalReviewsCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action & Rate Box */}
        <div className="p-6 rounded-2xl border bg-secondary/30 flex flex-col items-center md:items-end justify-center gap-3 w-full md:w-auto shrink-0">
          <div className="text-center md:text-right">
            <span className="text-2xl sm:text-3xl font-extrabold">{tutor.hourlyFee.toLocaleString()} MMK</span>
            <span className="text-xs text-muted-foreground"> / hour</span>
          </div>

          {user?.userId !== tutor.userId && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login')
                } else {
                  setInquiryModalOpen(true)
                }
              }}
              className="w-full px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm flex items-center justify-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send Inquiry</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Bio & Subjects + Schedule Availability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Biography & Subjects */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border bg-card space-y-4">
            <h2 className="text-lg font-bold">About the Educator</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {tutor.biography || 'This tutor has not yet added an extensive biography.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card space-y-4">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Academic Subjects & Specialties</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tutor.categories.map((c) => (
                <div key={c.categoryId} className="p-3 rounded-xl border bg-secondary/30 flex items-center justify-between">
                  <span className="font-semibold text-sm">{c.name}</span>
                  {c.gradeLevelTarget && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-background border text-muted-foreground">
                      {c.gradeLevelTarget}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Student Reviews */}
          <div className="p-6 rounded-2xl border bg-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span>Student Feedback & Ratings</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verified reviews submitted by students and parents
                </p>
              </div>

              {!isOwnProfile && (
                <div>
                  {isAuthenticated ? (
                    existingUserReview ? (
                      <Link
                        to="/reviews"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>You reviewed ({existingUserReview.starRating}★) • Manage</span>
                      </Link>
                    ) : (
                      <button
                        onClick={handleOpenReviewModal}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs flex items-center space-x-1.5"
                      >
                        <Star className="h-3.5 w-3.5" />
                        <span>Write a Review</span>
                      </button>
                    )
                  ) : (
                    <Link
                      to={`/login?redirect=/tutors/${tutor.id}`}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border bg-card hover:bg-secondary transition shadow-xs flex items-center space-x-1.5"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>Sign in to Review</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {reviewSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-medium flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{reviewSuccessMessage}</span>
              </div>
            )}

            {/* Score Summary & Star Breakdown (Visible to Public) */}
            <div className="p-4 rounded-xl border bg-secondary/15 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:text-left sm:pr-6 sm:border-r space-y-1 shrink-0">
                <div className="text-4xl font-extrabold tracking-tight">
                  {tutor.averageRating > 0 ? tutor.averageRating.toFixed(2) : '0.00'}
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(tutor.averageRating)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {tutor.totalReviewsCount} {tutor.totalReviewsCount === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Breakdown Bars */}
              <div className="flex-1 w-full space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = tutor.ratingBreakdown?.[star] || 0
                  const pct = tutor.totalReviewsCount > 0 ? Math.round((count / tutor.totalReviewsCount) * 100) : 0
                  return (
                    <div key={star} className="flex items-center space-x-2 text-xs">
                      <span className="w-6 text-muted-foreground font-medium flex items-center justify-end">
                        {star}★
                      </span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-[11px] text-muted-foreground text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Detailed Feedback Messages: Only Visible to Logged-in Users */}
            {!isAuthenticated ? (
              <div className="p-6 rounded-xl border border-dashed bg-secondary/30 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Detailed Feedback is Visible to Members Only</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Overall ratings and star score breakdowns are public. Sign in to your TDMS account to read detailed student feedback messages, testimonials, and reviewer profiles.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center space-x-3">
                  <Link
                    to={`/login?redirect=/tutors/${tutor.id}`}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs"
                  >
                    Sign In to View Feedback
                  </Link>
                  <Link
                    to="/register/learner"
                    className="px-4 py-2 text-xs font-semibold rounded-xl border bg-card hover:bg-secondary transition"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            ) : tutor.recentReviews.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No student reviews published yet.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {tutor.recentReviews
                  .slice((reviewsPage - 1) * reviewsPageSize, reviewsPage * reviewsPageSize)
                  .map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border bg-secondary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                          {r.learnerName.slice(0, 1)}
                        </div>
                        <span className="font-semibold text-xs text-foreground">{r.learnerName}</span>
                      </div>
                      <div className="flex items-center space-x-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < r.starRating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-muted-foreground leading-relaxed pl-9">{r.comment}</p>
                    )}
                    <div className="text-[10px] text-muted-foreground/70 pl-9">
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                <Pagination
                  currentPage={reviewsPage}
                  totalItems={tutor.recentReviews.length}
                  pageSize={reviewsPageSize}
                  onPageChange={setReviewsPage}
                  onPageSizeChange={setReviewsPageSize}
                  pageSizeOptions={[3, 5, 10]}
                  itemLabel="student reviews"
                  className="pt-2"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Schedule Slots */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border bg-card space-y-4">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Weekly Availability</span>
            </h2>

            {tutor.scheduleSlots.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recurring weekly slots specified yet.</p>
            ) : (
              <div className="space-y-2">
                {tutor.scheduleSlots.map((slot, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border bg-secondary/20 flex items-center justify-between text-xs">
                    <span className="font-semibold">{DAYS[slot.dayOfWeek]}</span>
                    <span className="text-foreground font-medium">
                      {formatTimeAmPm(slot.startTime)} – {formatTimeAmPm(slot.endTime)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Inquiry Modal */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg">Send Inquiry to {tutor.fullName}</h3>
              <button onClick={() => setInquiryModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-base">Inquiry Sent Successfully!</h4>
                <p className="text-xs text-muted-foreground">Redirecting to your messaging inbox...</p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Select Subject</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Choose a subject...</option>
                    {tutor.categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Learning Requirements & Schedule Needs</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your student's goals, preferred days/times, and current level..."
                    value={requirementSummary}
                    onChange={(e) => setRequirementSummary(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium rounded-lg border hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                  >
                    {inquirySubmitting ? 'Sending...' : 'Submit Inquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Write Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg">Review {tutor.fullName}</h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {reviewErrorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                  {reviewErrorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Your Star Rating</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-muted-foreground ml-2">
                    {reviewRating} of 5 stars
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Your Feedback & Experience</label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about the teaching quality, pace, responsiveness, and subjects covered..."
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition shadow-xs"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
