import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Pagination } from '../components/Pagination'
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
  const [activeTab, setActiveTab] = useState<'authored' | 'received'>('authored')
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
    return <div className="container mx-auto px-4 py-20 text-center text-sm text-muted-foreground">Loading reviews...</div>
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

      {/* Tabs */}
      <div className="flex border-b space-x-4 text-xs sm:text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('authored')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'authored'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Reviews Given by Me ({authored.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'received'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Reviews Received ({received.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'authored' ? (
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
