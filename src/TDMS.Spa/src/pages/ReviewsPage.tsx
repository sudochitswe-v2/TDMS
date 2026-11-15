import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Pagination } from '../components/Pagination'
import { Skeleton, LoadingSpinner } from '../components/Loading'
import { Star, MessageSquare, Edit3, CheckCircle2, AlertCircle } from 'lucide-react'

interface ReviewItem {
  id: string
  tutorProfileId?: string
  tutorName?: string
  learnerUserId?: string
  learnerName?: string
  starRating: number
  comment: string
  createdAt: string
  updatedAt?: string
}

interface MyReviewsResponse {
  authoredReviews: ReviewItem[]
  receivedReviews: ReviewItem[]
}

export const ReviewsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canViewReviewsByMe = hasPermission('view:menu:reviews_by_me')

  const [activeTab, setActiveTab] = useState<'authored' | 'received'>(() =>
    canViewReviewsByMe ? 'authored' : 'received'
  )

  useEffect(() => {
    if (!canViewReviewsByMe && activeTab === 'authored') {
      setActiveTab('received')
    }
  }, [canViewReviewsByMe, activeTab])

  const [authoredPage, setAuthoredPage] = useState(1)
  const [receivedPage, setReceivedPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { data, isLoading } = useQuery<MyReviewsResponse>({
    queryKey: ['myReviews'],
    queryFn: () => api.get('/api/reviews/me'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, starRating, comment }: { id: string; starRating: number; comment: string }) =>
      api.put(`/api/reviews/${id}`, { starRating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReviews'] })
      setEditingReviewId(null)
      setMessage('Review updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update review')
    },
  })

  const handleStartEdit = (review: ReviewItem) => {
    setEditingReviewId(review.id)
    setEditRating(review.starRating)
    setEditComment(review.comment)
    setErrorMessage('')
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReviewId) return
    updateMutation.mutate({
      id: editingReviewId,
      starRating: editRating,
      comment: editComment.trim(),
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-10 max-w-4xl space-y-6 animate-in fade-in">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex space-x-2 border-b pb-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <LoadingSpinner size="md" text="Loading reviews..." center />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const authored = data?.authoredReviews || []
  const received = data?.receivedReviews || []

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Reviews & Tutor Ratings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your submitted student feedback or inspect reviews received from parents & students
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Responsive Tabs (Sticky, Touch-Friendly, No Ugly Scrollbars) */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {canViewReviewsByMe && (
            <button
              type="button"
              onClick={() => setActiveTab('authored')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
                activeTab === 'authored'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>Reviews by Me</span>
              <span
                className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                  activeTab === 'authored' ? 'bg-primary-foreground text-primary' : 'bg-primary/15 text-primary'
                }`}
              >
                {authored.length}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'received'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Star className="h-4 w-4" />
            <span>Reviews Received</span>
            <span
              className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                activeTab === 'received' ? 'bg-primary-foreground text-primary' : 'bg-primary/15 text-primary'
              }`}
            >
              {received.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'authored' && canViewReviewsByMe ? (
        <div className="space-y-4">
          {authored.length === 0 ? (
            <div className="p-8 text-center border rounded-2xl bg-card text-xs text-muted-foreground">
              You haven't submitted any tutor reviews yet. You can review verified tutors directly from their profile pages.
            </div>
          ) : (
            <>
              {authored
                .slice((authoredPage - 1) * pageSize, authoredPage * pageSize)
                .map((r) => (
                <div key={r.id} className="p-5 rounded-2xl border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Tutor: {r.tutorName}</h3>
                      <p className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 text-amber-500">
                        {Array.from({ length: r.starRating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <button
                        onClick={() => handleStartEdit(r)}
                        className="p-1.5 rounded-lg border text-muted-foreground hover:bg-secondary text-xs flex items-center space-x-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{r.comment}</p>
                </div>
              ))}

              <div className="p-4 rounded-2xl border bg-card shadow-xs">
                <Pagination
                  currentPage={authoredPage}
                  totalItems={authored.length}
                  pageSize={pageSize}
                  onPageChange={setAuthoredPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20]}
                  itemLabel="authored reviews"
                  className="pt-0 border-t-0"
                />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {received.length === 0 ? (
            <div className="p-8 text-center border rounded-2xl bg-card text-xs text-muted-foreground">
              No reviews received yet. High-quality tutoring sessions help gather student feedback!
            </div>
          ) : (
            <>
              {received
                .slice((receivedPage - 1) * pageSize, receivedPage * pageSize)
                .map((r) => (
                <div key={r.id} className="p-5 rounded-2xl border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{r.learnerName}</span>
                    <div className="flex items-center space-x-0.5 text-amber-500">
                      {Array.from({ length: r.starRating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.comment}</p>
                  <p className="text-[10px] text-muted-foreground/70">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}

              <div className="p-4 rounded-2xl border bg-card shadow-xs">
                <Pagination
                  currentPage={receivedPage}
                  totalItems={received.length}
                  pageSize={pageSize}
                  onPageChange={setReceivedPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20]}
                  itemLabel="received reviews"
                  className="pt-0 border-t-0"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReviewId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base">Edit Your Tutor Review</h3>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Star Rating (1 to 5)</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setEditRating(star)}
                      className={`p-1.5 rounded-lg border transition ${
                        editRating >= star ? 'text-amber-500 border-amber-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold pl-2">{editRating} / 5 Stars</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Comment</label>
                <textarea
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingReviewId(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Update Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
