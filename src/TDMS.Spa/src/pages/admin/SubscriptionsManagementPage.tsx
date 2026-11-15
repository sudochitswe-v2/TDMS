import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import { Pagination } from '../../components/Pagination'
import { CardSkeleton, LoadingSpinner } from '../../components/Loading'
import {
  CreditCard,
  Plus,
  Pencil,
  CheckCircle,
  X,
  AlertTriangle,
  Zap,
  BookOpen,
  Calendar,
  Receipt
} from 'lucide-react'

interface SubscriptionPackage {
  id: string | number
  tierName: string
  durationDays: number
  displayFee: number
  maxActiveSubjects: number
  prioritySearchBoost: number
  featuresJson: string | null
  isActive: boolean
}

export const SubscriptionsManagementPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [editingPkg, setEditingPkg] = useState<SubscriptionPackage | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const [tierName, setTierName] = useState('')
  const [durationDays, setDurationDays] = useState(30)
  const [displayFee, setDisplayFee] = useState(0)
  const [maxActiveSubjects, setMaxActiveSubjects] = useState(3)
  const [prioritySearchBoost, setPrioritySearchBoost] = useState(0)
  const [featuresText, setFeaturesText] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data: packages = [], isLoading } = useQuery<SubscriptionPackage[]>({
    queryKey: ['adminSubscriptions'],
    queryFn: () => api.get<SubscriptionPackage[]>('/api/subscriptions'),
  })

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string | number; body: any }) => {
      if (payload.id) {
        return api.put(`/api/subscriptions/${payload.id}`, payload.body)
      }
      return api.post('/api/subscriptions', payload.body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] })
      setSuccessMsg('Subscription package saved successfully.')
      setErrorMsg(null)
      closeForm()
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to save subscription package')
    },
  })

  const startCreate = () => {
    setIsCreating(true)
    setEditingPkg(null)
    setTierName('')
    setDurationDays(30)
    setDisplayFee(0)
    setMaxActiveSubjects(3)
    setPrioritySearchBoost(0)
    setFeaturesText('Profile Search Listing\nDirect Learner Inquiries\nSubject Listing Limit: 3')
    setIsActive(true)
    setErrorMsg(null)
  }

  const startEdit = (pkg: SubscriptionPackage) => {
    setEditingPkg(pkg)
    setIsCreating(false)
    setTierName(pkg.tierName)
    setDurationDays(pkg.durationDays)
    setDisplayFee(pkg.displayFee)
    setMaxActiveSubjects(pkg.maxActiveSubjects)
    setPrioritySearchBoost(pkg.prioritySearchBoost)
    try {
      const parsed = pkg.featuresJson ? JSON.parse(pkg.featuresJson) : []
      setFeaturesText(Array.isArray(parsed) ? parsed.join('\n') : '')
    } catch {
      setFeaturesText(pkg.featuresJson || '')
    }
    setIsActive(pkg.isActive)
    setErrorMsg(null)
  }

  const closeForm = () => {
    setIsCreating(false)
    setEditingPkg(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tierName.trim()) {
      setErrorMsg('Tier Name is required')
      return
    }

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)

    const body = {
      tierName: tierName.trim(),
      durationDays: Number(durationDays),
      displayFee: Number(displayFee),
      maxActiveSubjects: Number(maxActiveSubjects),
      prioritySearchBoost: Number(prioritySearchBoost),
      features,
      isActive,
    }

    saveMutation.mutate({
      id: editingPkg ? editingPkg.id : undefined,
      body,
    })
  }

  const parseFeatures = (json: string | null): string[] => {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutor Subscription Packages</h1>
        </div>
        <div className="flex">
          <button
            onClick={startCreate}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription Tier</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Package Form */}
      {(isCreating || editingPkg) && (
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-base flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <span>{isCreating ? 'Create Subscription Package' : `Edit Tier: ${editingPkg?.tierName}`}</span>
            </h2>
            <button onClick={closeForm} className="p-1 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-muted-foreground">Tier Name *</label>
                <input
                  type="text"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="e.g. Premium Educator"
                  required
                  className="w-full p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-muted-foreground">Display Price (MMK)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={displayFee}
                  onChange={(e) => setDisplayFee(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-muted-foreground">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-muted-foreground">Max Subjects Taught</label>
                <input
                  type="number"
                  min="1"
                  value={maxActiveSubjects}
                  onChange={(e) => setMaxActiveSubjects(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-muted-foreground">Priority Boost Factor (pts)</label>
                <input
                  type="number"
                  min="0"
                  value={prioritySearchBoost}
                  onChange={(e) => setPrioritySearchBoost(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex items-center space-x-3 pt-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-2 text-xs font-medium text-foreground">
                    {isActive ? 'Active Plan' : 'Archived Plan'}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-muted-foreground">Included Features (one per line)</label>
              <textarea
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="Featured Badge on Profile&#10;Top Placement in Search Matches&#10;Direct Video Chat Guidance"
                rows={4}
                className="w-full p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Save Package
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 space-y-4">
            <LoadingSpinner size="md" text="Loading subscription tier packages..." center />
            <CardSkeleton count={3} variant="package" />
          </div>
        ) : packages.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-muted-foreground text-sm">
            No subscription packages configured. Create the first tier above.
          </div>
        ) : (
          packages
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((pkg) => {
              const features = parseFeatures(pkg.featuresJson)
              return (
                <div
                  key={pkg.id}
                  className={`p-6 rounded-2xl border bg-card shadow-sm flex flex-col justify-between space-y-5 relative ${pkg.prioritySearchBoost > 0 ? 'ring-2 ring-primary/40' : ''
                    }`}
                >
                  {pkg.prioritySearchBoost > 0 && (
                    <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm uppercase tracking-wider flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>+{pkg.prioritySearchBoost} Priority Boost</span>
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-lg text-foreground">{pkg.tierName}</h3>
                        <p className="text-xs text-muted-foreground flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{pkg.durationDays} days duration</span>
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pkg.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-secondary text-muted-foreground border'
                          }`}
                      >
                        {pkg.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                        {pkg.displayFee.toLocaleString()} MMK
                      </span>
                      <span className="text-xs text-muted-foreground">/ billing cycle</span>
                    </div>

                    <div className="space-y-2 text-xs border-t pt-4">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          Subject Slots: <strong>{pkg.maxActiveSubjects} subjects</strong>
                        </span>
                      </div>

                      {features.map((feat, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    <button
                      onClick={() => startEdit(pkg)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border hover:bg-secondary text-xs font-semibold text-foreground transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Tier</span>
                    </button>
                  </div>
                </div>
              )
            })
        )}
      </div>

      {/* Pagination Controls */}
      {!isLoading && packages.length > 0 && (
        <div className="p-4 rounded-2xl border bg-card shadow-xs">
          <Pagination
            currentPage={currentPage}
            totalItems={packages.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[3, 6, 12]}
            itemLabel="subscription packages"
            className="pt-0 border-t-0"
          />
        </div>
      )}
    </div>
  )
}
