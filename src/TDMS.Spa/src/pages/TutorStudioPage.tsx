import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatTimeAmPm, formatFileSize } from '../lib/formatters'
import { useAuth } from '../context/AuthContext'
import { DetailProfileSkeleton } from '../components/Loading'
import { TimeSelect } from '../components/TimeSelect'
import {
  GraduationCap,
  Calendar,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Palette,
  AlertCircle,
  Eye,
  Upload,
  FileText,
  Image as ImageIcon,
  Award,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Clock,
  User,
  FileCheck,
  Copy,
  Check,
  Receipt,
  X
} from 'lucide-react'

interface ScheduleSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface SubscriptionPaymentItem {
  id: number
  subscriptionPackageId: number
  packageName: string
  amount: number
  paymentMethod: string
  transactionLast6: string
  screenshotUrl: string
  notes?: string | null
  status: 'Pending' | 'Confirmed' | 'Rejected'
  rejectionReason?: string | null
  createdAt: string
  reviewedAt?: string | null
}

interface PaymentAccountInfo {
  method: string
  accountName: string
  accountNumber: string
  type: string
  recommended: boolean
}

interface PaymentInfoResponse {
  instructions: string
  accounts: PaymentAccountInfo[]
}

interface TutorMeResponse {
  id: string
  userId: string
  headline?: string
  biography?: string
  yearsOfExperience: number
  hourlyFee: number
  teachingMode: string
  verificationStatus: string
  rejectionReason?: string
  profilePictureUrl?: string | null
  averageRating: number
  totalReviewsCount: number
  isPublished: boolean
  layoutThemeJson?: string
  currentSubscriptionPackageId?: number
  subscriptionPackage?: {
    id: number
    tierName: string
    maxActiveSubjects: number
    prioritySearchBoost: number
  }
  categories: { categoryId: number; name: string }[]
  scheduleSlots: ScheduleSlot[]
  documents: {
    id: number
    documentType: string
    fileName?: string
    fileUrl: string
    fileSizeBytes?: number
    uploadedAt: string
  }[]
}

interface CategoryItem {
  id: number
  name: string
}

interface SubscriptionPackage {
  id: number
  tierName: string
  durationDays: number
  displayFee: number
  maxActiveSubjects: number
  prioritySearchBoost: number
  featuresJson?: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const TutorStudioPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'teaching' | 'customization' | 'verification' | 'subscription'>('teaching')

  // Teaching state
  const [hourlyFee, setHourlyFee] = useState(25000)
  const [teachingMode, setTeachingMode] = useState('Online')
  const [yearsOfExperience, setYearsOfExperience] = useState(2)
  const [categoryIds, setCategoryIds] = useState<number[]>([])
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])

  // Customization state
  const [headline, setHeadline] = useState('')
  const [biography, setBiography] = useState('')
  const [layoutThemeJson, setLayoutThemeJson] = useState('{"themeColor":"blue"}')
  const [isPublished, setIsPublished] = useState(false)

  // Verification & Credentials state
  const [profilePicBase64, setProfilePicBase64] = useState<string | null>(null)
  const [newDocType, setNewDocType] = useState('AcademicCertificate')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedFileBase64, setSelectedFileBase64] = useState('')
  const [selectedFileSize, setSelectedFileSize] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const picInputRef = useRef<HTMLInputElement>(null)

  // Subscription Payment Purchase state
  const [purchasingPkg, setPurchasingPkg] = useState<SubscriptionPackage | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('KBZPay')
  const [trxLast6, setTrxLast6] = useState('')
  const [proofScreenshotBase64, setProofScreenshotBase64] = useState('')
  const [proofScreenshotFileName, setProofScreenshotFileName] = useState('')
  const [purchaseNotes, setPurchaseNotes] = useState('')
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null)
  const screenshotInputRef = useRef<HTMLInputElement>(null)

  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: tutor, isLoading } = useQuery<TutorMeResponse>({
    queryKey: ['tutorMe'],
    queryFn: () => api.get('/api/tutors/me'),
  })

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories'),
  })

  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/api/subscriptions'),
  })

  const { data: myPayments = [] } = useQuery<SubscriptionPaymentItem[]>({
    queryKey: ['mySubscriptionPayments'],
    queryFn: () => api.get('/api/subscriptions/my-payments'),
  })

  const { data: paymentInfo } = useQuery<PaymentInfoResponse>({
    queryKey: ['subscriptionPaymentInfo'],
    queryFn: () => api.get('/api/subscriptions/payment-info'),
  })

  useEffect(() => {
    if (tutor) {
      setHourlyFee(tutor.hourlyFee || 25000)
      setTeachingMode(tutor.teachingMode || 'Online')
      setYearsOfExperience(tutor.yearsOfExperience || 1)
      setCategoryIds(tutor.categories.map((c) => c.categoryId))
      setScheduleSlots(tutor.scheduleSlots || [])
      setHeadline(tutor.headline || '')
      setBiography(tutor.biography || '')
      setLayoutThemeJson(tutor.layoutThemeJson || '{"themeColor":"blue"}')
      setIsPublished(tutor.isPublished || false)
      setProfilePicBase64(tutor.profilePictureUrl || null)
    }
  }, [tutor])

  const updateProfilePicMutation = useMutation({
    mutationFn: (base64: string) => api.put('/api/tutors/me/profile-picture', { profilePictureBase64: base64 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorMe'] })
      setMessage('Profile photo updated successfully!')
      setErrorMsg('')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update profile photo')
    }
  })

  const uploadDocMutation = useMutation({
    mutationFn: (data: { documentType: string; fileName: string; fileBase64: string }) =>
      api.post('/api/tutors/me/documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorMe'] })
      setSelectedFileName('')
      setSelectedFileBase64('')
      setSelectedFileSize(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setMessage('Verification document uploaded successfully!')
      setErrorMsg('')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to upload document')
    }
  })

  const deleteDocMutation = useMutation({
    mutationFn: (documentId: number) => api.delete(`/api/tutors/me/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorMe'] })
      setMessage('Document removed successfully.')
      setErrorMsg('')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to delete document')
    }
  })

  const reverifyMutation = useMutation({
    mutationFn: () => api.post('/api/tutors/me/reverify'),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['tutorMe'] })
      setMessage(data.message || 'Application submitted for verification!')
      setErrorMsg('')
      setTimeout(() => setMessage(''), 4000)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit for re-verification')
    }
  })

  const handlePicSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Profile photo must be smaller than 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setProfilePicBase64(result)
      updateProfilePicMutation.mutate(result)
    }
    reader.readAsDataURL(file)
  }

  const handleDocSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Document file must be smaller than 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFileName(file.name)
      setSelectedFileSize(file.size)
      setSelectedFileBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFileBase64) {
      setErrorMsg('Please select a file to upload.')
      return
    }
    uploadDocMutation.mutate({
      documentType: newDocType,
      fileName: selectedFileName || `${newDocType}_document`,
      fileBase64: selectedFileBase64
    })
  }

  const saveTeachingInfo = useMutation({
    mutationFn: (data: any) => api.put('/api/tutors/me/teaching-info', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorMe'] })
      setMessage('Teaching info and schedule saved successfully!')
      setErrorMsg('')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to save teaching info')
      setMessage('')
    },
  })

  const saveCustomization = useMutation({
    mutationFn: (data: any) => api.put('/api/tutors/me/customization', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorMe'] })
      setMessage('Profile customization and publish state saved!')
      setErrorMsg('')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to save customization')
      setMessage('')
    },
  })

  const selectPackage = useMutation({
    mutationFn: (pkgId: number) => api.post(`/api/subscriptions/${pkgId}/select`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['tutorMe'] })
      setMessage(data?.message || 'Subscription package updated!')
      setErrorMsg('')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to activate plan')
    }
  })

  const purchaseSubscriptionMutation = useMutation({
    mutationFn: (data: {
      packageId: number
      paymentMethod: string
      transactionLast6: string
      screenshotBase64: string
      notes?: string
    }) => api.post('/api/subscriptions/purchase', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['tutorMe'] })
      queryClient.invalidateQueries({ queryKey: ['mySubscriptionPayments'] })
      setPurchasingPkg(null)
      setTrxLast6('')
      setProofScreenshotBase64('')
      setProofScreenshotFileName('')
      setPurchaseNotes('')
      setMessage(data?.message || 'Payment proof submitted successfully! Awaiting Operations verification.')
      setErrorMsg('')
      setTimeout(() => setMessage(''), 5000)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to submit subscription payment')
    }
  })

  const handleOpenPurchase = (pkg: SubscriptionPackage) => {
    if (pkg.displayFee <= 0) {
      selectPackage.mutate(pkg.id)
      return
    }
    setPurchasingPkg(pkg)
    setSelectedPaymentMethod('KBZPay')
    setTrxLast6('')
    setProofScreenshotBase64('')
    setProofScreenshotFileName('')
    setPurchaseNotes('')
    setErrorMsg('')
  }

  const handleScreenshotSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Screenshot file size must be less than 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setProofScreenshotBase64(reader.result as string)
      setProofScreenshotFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleCopyAccount = (accountNumber: string, method: string) => {
    navigator.clipboard.writeText(accountNumber)
    setCopiedMethod(method)
    setTimeout(() => setCopiedMethod(null), 2000)
  }

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchasingPkg) return
    if (!trxLast6.trim() || trxLast6.trim().length < 4) {
      setErrorMsg('Please enter at least the last 4 to 6 characters of your transaction reference ID.')
      return
    }
    if (!proofScreenshotBase64) {
      setErrorMsg('Please attach a clear screenshot of your payment transfer receipt.')
      return
    }
    purchaseSubscriptionMutation.mutate({
      packageId: purchasingPkg.id,
      paymentMethod: selectedPaymentMethod,
      transactionLast6: trxLast6.trim(),
      screenshotBase64: proofScreenshotBase64,
      notes: purchaseNotes.trim() || undefined
    })
  }

  const handleSaveTeaching = (e: React.FormEvent) => {
    e.preventDefault()
    saveTeachingInfo.mutate({
      hourlyFee,
      teachingMode,
      yearsOfExperience,
      categoryIds,
      scheduleSlots,
    })
  }

  const handleSaveCustomization = (e: React.FormEvent) => {
    e.preventDefault()
    saveCustomization.mutate({
      headline,
      biography,
      layoutThemeJson,
      isPublished,
    })
  }

  const toggleCategory = (id: number) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const addSlot = () => {
    setScheduleSlots((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: '17:00', endTime: '19:00' },
    ])
  }

  const updateSlot = (index: number, field: keyof ScheduleSlot, value: any) => {
    setScheduleSlots((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const removeSlot = (index: number) => {
    setScheduleSlots((prev) => prev.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return <DetailProfileSkeleton title="Loading tutor studio workspace..." />
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      {/* Studio Header */}
      <div className="p-6 rounded-3xl border bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight">Tutor Studio Workspace</h1>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tutor?.verificationStatus === 'Verified'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : tutor?.verificationStatus === 'Rejected'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
            >
              Status: {tutor?.verificationStatus}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Current Plan :{' '}
            <span className="font-semibold text-primary">{tutor?.subscriptionPackage?.tierName || 'Basic Tier'}</span>
            {' '}• Priority Boost: +{tutor?.subscriptionPackage?.prioritySearchBoost || 0}%
          </p>
        </div>

        {tutor?.verificationStatus === 'Rejected' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs max-w-md">
              <strong>Rejection Reason:</strong> {tutor.rejectionReason || 'Additional documents required.'}
            </div>
            <button
              type="button"
              onClick={() => reverifyMutation.mutate()}
              disabled={reverifyMutation.isPending}
              className="px-3 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold text-xs hover:bg-destructive/90 transition shadow-sm flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${reverifyMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{reverifyMutation.isPending ? 'Submitting...' : 'Re-verify'}</span>
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Responsive Tab Bar (Sticky, Touch-Friendly, No Ugly Scrollbars) */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setActiveTab('teaching')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'teaching'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Teaching Info & Schedule</span>
            <span className="sm:hidden">Teaching & Slots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customization')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'customization'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Profile Customization & Visibility</span>
            <span className="sm:hidden">Profile Design</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'verification'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Verification & Credentials</span>
            <span className="sm:hidden">Credentials</span>
            {tutor?.verificationStatus === 'Rejected' && (
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
            {tutor?.verificationStatus === 'Verified' && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'subscription'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Subscription Packages</span>
            <span className="sm:hidden">Subscription</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Teaching Info */}
      {activeTab === 'teaching' && (
        <form onSubmit={handleSaveTeaching} className="space-y-6">
          <div className="p-6 rounded-2xl border bg-card space-y-4">
            <h2 className="text-base font-bold">Rates & Teaching Mode</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Teaching Mode</label>
                <select
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                >
                  <option value="Online">Online Only</option>
                  <option value="InPerson">In-Person Only</option>
                  <option value="Both">Both (Hybrid)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Hourly Fee</span>
                  <span className="text-primary font-bold">{hourlyFee.toLocaleString()} MMK / hr</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="5000"
                  value={hourlyFee}
                  onChange={(e) => setHourlyFee(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="p-6 rounded-2xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Subject Categories Taught</h2>
                <p className="text-xs text-muted-foreground">
                  Your current tier allows up to {tutor?.subscriptionPackage?.maxActiveSubjects || 3} active subjects ({categoryIds.length} selected).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((c) => {
                const selected = categoryIds.includes(c.id)
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'bg-secondary/30 text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{c.name}</span>
                      {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Schedule Slots */}
          <div className="p-6 rounded-2xl border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Weekly Recurring Availability Slots</span>
              </h2>
              <button
                type="button"
                onClick={addSlot}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-secondary transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Slot</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {scheduleSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border bg-secondary/20 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3 transition"
                >
                  {/* Top row on mobile: Day selector + Delete button */}
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <select
                      value={slot.dayOfWeek}
                      onChange={(e) => updateSlot(idx, 'dayOfWeek', Number(e.target.value))}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium rounded-lg border bg-background text-foreground dark:bg-card dark:text-card-foreground"
                    >
                      {DAYS.map((d, i) => (
                        <option
                          key={i}
                          value={i}
                          className="bg-card text-card-foreground dark:bg-slate-900 dark:text-slate-100"
                        >
                          {d}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="sm:hidden p-1.5 rounded-lg text-destructive hover:bg-destructive/10"
                      title="Remove slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Bottom row on mobile: Time selector with AM/PM selector + Formatted badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                      <TimeSelect
                        value={slot.startTime}
                        onChange={(val) => updateSlot(idx, 'startTime', val)}
                        ariaLabelPrefix={`Slot ${idx + 1} Start`}
                      />
                      <span className="text-xs text-muted-foreground font-medium px-0.5">to</span>
                      <TimeSelect
                        value={slot.endTime}
                        onChange={(val) => updateSlot(idx, 'endTime', val)}
                        ariaLabelPrefix={`Slot ${idx + 1} End`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-primary px-2.5 py-1 rounded-md bg-primary/10 whitespace-nowrap">
                      {formatTimeAmPm(slot.startTime)} – {formatTimeAmPm(slot.endTime)}
                    </span>
                  </div>

                  {/* Desktop delete button */}
                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    className="hidden sm:inline-flex p-1.5 rounded-lg text-destructive hover:bg-destructive/10 ml-auto shrink-0"
                    title="Remove slot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saveTeachingInfo.isPending}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm cursor-pointer active:scale-95"
          >
            {saveTeachingInfo.isPending ? 'Saving...' : 'Save Teaching Information'}
          </button>
        </form>
      )}

      {/* Tab 2: Customization */}
      {activeTab === 'customization' && (
        <form onSubmit={handleSaveCustomization} className="space-y-6">
          <div className="p-6 rounded-2xl border bg-card space-y-4">
            <h2 className="text-base font-bold">Educator Profile Headline & Biography</h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Expert Cambridge & IB Chemistry Tutor"
                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Detailed Biography</label>
              <textarea
                rows={5}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                placeholder="Share your teaching style, achievements, student results, and credentials..."
                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="pt-4 border-t flex items-center justify-between">
              <div>
                <label className="text-sm font-bold block">Publish to Public Tutor Directory</label>
                <p className="text-xs text-muted-foreground">
                  When enabled, your profile appears in search results. Requires administrator verification.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPublished}
                disabled={tutor?.verificationStatus !== 'Verified'}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-5 w-5 accent-primary cursor-pointer disabled:opacity-50"
              />
            </div>

            {tutor?.verificationStatus !== 'Verified' && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Your profile must be verified by an Operation Admin before it can be published to search.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saveCustomization.isPending}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm cursor-pointer active:scale-95"
          >
            {saveCustomization.isPending ? 'Saving...' : 'Save Profile Customization'}
          </button>
        </form>
      )}

      {/* Tab 3: Verification & Credentials */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          {tutor?.verificationStatus === 'Rejected' && (
            <div className="p-5 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <h3 className="font-bold text-sm">Application Needs Revision</h3>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    <strong>Rejection feedback:</strong> {tutor.rejectionReason || 'Uploaded documentation was insufficient.'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please update your profile picture or upload relevant academic certificates / tutoring proof documents below, then submit for re-verification.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => reverifyMutation.mutate()}
                  disabled={reverifyMutation.isPending}
                  className="px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-xs hover:bg-destructive/90 transition shadow-sm flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${reverifyMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{reverifyMutation.isPending ? 'Submitting...' : 'Submit for Re-verification'}</span>
                </button>
              </div>
            </div>
          )}

          {tutor?.verificationStatus === 'Pending' && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 shrink-0" />
                <h3 className="font-bold text-sm">Verification Under Review</h3>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Your profile picture and credentials are currently being reviewed by our Operations Admin team. You may still upload additional certificates or adjust your profile photo while waiting.
              </p>
            </div>
          )}

          {tutor?.verificationStatus === 'Verified' && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 space-y-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <h3 className="font-bold text-sm">Verified Educator Status</h3>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Congratulations! Your identity and credentials have been approved. You can publish your profile in the "Profile Customization & Visibility" tab.
              </p>
            </div>
          )}

          {/* Profile Picture Upload Card */}
          <div className="p-6 rounded-2xl border bg-card space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <User className="h-4 w-4 text-primary" />
                <span>Profile Photo (Stored as Base64)</span>
              </h2>
              <span className="text-[11px] text-muted-foreground">PNG, JPG, WebP up to 2MB</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
              <div className="relative group shrink-0">
                {profilePicBase64 ? (
                  <img
                    src={profilePicBase64}
                    alt="Tutor profile"
                    className="h-28 w-28 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-2xl bg-secondary flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed">
                    <User className="h-10 w-10 mb-1 opacity-50" />
                    <span className="text-[10px]">No Photo</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <h4 className="font-semibold text-sm">Official Tutor Avatar</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your photo will be displayed across student search results, your profile page, and to Operations Admins during verification.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={picInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePicSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => picInputRef.current?.click()}
                    disabled={updateProfilePicMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm flex items-center space-x-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{updateProfilePicMutation.isPending ? 'Saving...' : profilePicBase64 ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                  {profilePicBase64 && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePicBase64(null)
                        updateProfilePicMutation.mutate('')
                      }}
                      disabled={updateProfilePicMutation.isPending}
                      className="px-3 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic & Tutoring Proof Documents Form */}
          <form onSubmit={handleUploadDoc} className="p-6 rounded-2xl border bg-card space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>Upload Academic & Tutoring Proof Documents</span>
              </h2>
              <span className="text-[11px] text-muted-foreground">Images, PDF, DOC, DOCX up to 5MB</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload proof of your degrees, academic transcripts, or tutoring work history. Files are converted and stored securely as Base64 strings in the database.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Document Category</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="AcademicCertificate">Academic Degree / Certificate</option>
                  <option value="TutoringProof">Proof of Tutoring Work / History</option>
                  <option value="ProfessionalLicense">Teaching License / Accreditation</option>
                  <option value="IdentityDocument">Government ID / Passport</option>
                  <option value="Other">Other Supporting Document</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold">Select File (Image or Document)</label>
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleDocSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs rounded-xl border bg-secondary/50 hover:bg-secondary font-medium transition flex items-center space-x-1.5 shrink-0"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Choose File...</span>
                  </button>
                  <div className="text-xs text-muted-foreground truncate flex-1 px-2">
                    {selectedFileName ? (
                      <span className="font-semibold text-foreground">
                        {selectedFileName} ({formatFileSize(selectedFileSize)})
                      </span>
                    ) : (
                      'No file selected'
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={!selectedFileBase64 || uploadDocMutation.isPending}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{uploadDocMutation.isPending ? 'Uploading...' : 'Save Document to Profile'}</span>
              </button>
            </div>
          </form>

          {/* Uploaded Documents List */}
          <div className="p-6 rounded-2xl border bg-card space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <span>Uploaded Documents ({tutor?.documents?.length || 0})</span>
              </h2>
            </div>

            {(!tutor?.documents || tutor.documents.length === 0) ? (
              <div className="py-8 text-center text-xs text-muted-foreground border rounded-xl bg-secondary/20 space-y-1">
                <p className="font-medium">No verification documents uploaded yet.</p>
                <p>Upload your academic certificate or tutoring proof above to proceed with verification.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tutor.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border bg-secondary/20 hover:border-primary/30 transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 truncate flex-1">
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
                      <p className="text-xs font-semibold text-foreground truncate">{doc.fileName || 'Document File'}</p>
                      <p className="text-[10px] text-muted-foreground">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName || `document_${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border hover:bg-secondary text-primary transition"
                        title="View / Download Document"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteDocMutation.mutate(doc.id)}
                        disabled={deleteDocMutation.isPending}
                        className="p-2 rounded-lg border border-destructive/30 hover:bg-destructive/10 text-destructive transition disabled:opacity-50"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Subscriptions */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Active Pending Payment Notification */}
          {(() => {
            const pendingPayment = myPayments.find((p) => p.status === 'Pending')
            if (!pendingPayment) return null
            return (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-xs">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Subscription Payment Verification in Progress</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Your purchase request for <strong>{pendingPayment.packageName}</strong> ({pendingPayment.amount.toLocaleString()} MMK via {pendingPayment.paymentMethod}, Trx #...{pendingPayment.transactionLast6}) was submitted on {new Date(pendingPayment.createdAt).toLocaleDateString()}. It is currently in queue for review by our Operations Admin.
                </p>
              </div>
            )
          })()}

          {/* Rejected Payment Notification */}
          {(() => {
            const latestPayment = myPayments[0]
            if (!latestPayment || latestPayment.status !== 'Rejected') return null
            return (
              <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive space-y-1">
                <div className="flex items-center space-x-2 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Previous Payment Proof Rejected</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  <strong>Operations feedback:</strong> {latestPayment.rejectionReason || 'The payment reference or screenshot could not be confirmed.'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Please verify your transaction with your mobile banking provider and submit a new payment proof below.
                </p>
              </div>
            )
          })()}

          {/* Payment Information Card */}
          <div className="p-6 rounded-2xl border bg-card space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Platform Payment Information & Accounts</span>
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                Manual Transfer
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {paymentInfo?.instructions ||
                'To subscribe to a premium plan, transfer the exact package amount in MMK to any of the official accounts below. Take a screenshot of the completed transfer slip, then click "Select & Pay" on your chosen tier to submit the last 6 digits of your transaction reference.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {(paymentInfo?.accounts || [
                { method: 'KBZPay', accountName: 'TDMS Education Co., Ltd.', accountNumber: '09-977-123-456', type: 'Mobile Wallet', recommended: true },
                { method: 'WavePay', accountName: 'TDMS Official Operations', accountNumber: '09-977-123-456', type: 'Mobile Wallet', recommended: false },
                { method: 'AYAPay', accountName: 'TDMS Education Services', accountNumber: '09-977-123-456', type: 'Mobile Wallet', recommended: false },
                { method: 'CBPay', accountName: 'TDMS Company Limited', accountNumber: '09-977-123-456', type: 'Mobile Wallet', recommended: false },
                { method: 'BankTransfer', accountName: 'TDMS Platform Co., Ltd.', accountNumber: '0123-4567-8901-2345', type: 'KBZ / CB Bank Account', recommended: false },
              ]).map((acc) => (
                <div key={acc.method} className="p-3.5 rounded-xl border bg-secondary/30 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">{acc.method}</span>
                    {acc.recommended && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-primary select-all">{acc.accountNumber}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{acc.accountName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount(acc.accountNumber, acc.method)}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center space-x-1 cursor-pointer pt-1"
                  >
                    {copiedMethod === acc.method ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Tiers Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Available Subscription Packages</h3>
              <span className="text-xs text-muted-foreground">Higher tiers grant active subject limits and priority boost</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const isCurrent = tutor?.currentSubscriptionPackageId === pkg.id
                const hasPending = myPayments.some((p) => p.status === 'Pending' && p.subscriptionPackageId === pkg.id)
                const features: string[] = pkg.featuresJson ? JSON.parse(pkg.featuresJson) : []

                return (
                  <div
                    key={pkg.id}
                    className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${isCurrent
                        ? 'border-primary bg-primary/5 shadow-md'
                        : hasPending
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'bg-card'
                      }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{pkg.tierName}</h3>
                        {isCurrent ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                            Active Plan
                          </span>
                        ) : hasPending ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                            Under Review
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <span className="text-3xl font-extrabold">{pkg.displayFee.toLocaleString()} MMK</span>
                        <span className="text-xs text-muted-foreground"> / {pkg.durationDays} days</span>
                      </div>

                      <ul className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
                        <li>• Up to {pkg.maxActiveSubjects} Active Subjects</li>
                        <li>• +{pkg.prioritySearchBoost}% Search Ranking Boost</li>
                        {features.map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      disabled={isCurrent || hasPending || selectPackage.isPending}
                      onClick={() => handleOpenPurchase(pkg)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${isCurrent
                          ? 'bg-secondary text-muted-foreground cursor-default'
                          : hasPending
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 cursor-default'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                        }`}
                    >
                      {isCurrent
                        ? 'Active Plan'
                        : hasPending
                          ? 'Verification in Progress'
                          : pkg.displayFee <= 0
                            ? 'Select Free Plan'
                            : `Select & Pay (${pkg.displayFee.toLocaleString()} MMK)`}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment History Section */}
          <div className="p-6 rounded-2xl border bg-card space-y-4 shadow-xs">
            <h3 className="font-bold text-sm flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Your Subscription Payment History ({myPayments.length})</span>
            </h3>

            {myPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3">
                No past subscription payments on record.
              </p>
            ) : (
              <div className="divide-y text-xs">
                {myPayments.map((p) => (
                  <div key={p.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground">{p.packageName}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status === 'Confirmed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : p.status === 'Rejected'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        {p.amount.toLocaleString()} MMK via {p.paymentMethod} &bull; Trx #...{p.transactionLast6} &bull; {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                      {p.status === 'Rejected' && p.rejectionReason && (
                        <p className="text-destructive font-medium text-[11px] mt-0.5">
                          Reason: {p.rejectionReason}
                        </p>
                      )}
                    </div>

                    <a
                      href={p.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center space-x-1 text-xs shrink-0 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Payment Proof Submission Modal */}
          {purchasingPkg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-base flex items-center space-x-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      <span>Subscribe to {purchasingPkg.tierName}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fee: <strong className="text-foreground">{purchasingPkg.displayFee.toLocaleString()} MMK</strong> for {purchasingPkg.durationDays} days
                    </p>
                  </div>
                  <button
                    onClick={() => setPurchasingPkg(null)}
                    className="p-1 rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitPurchase} className="space-y-4">
                  {/* Select Payment Method */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">1. Select Payment Method</label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="KBZPay">KBZPay (Mobile Wallet)</option>
                      <option value="WavePay">WavePay (Mobile Wallet)</option>
                      <option value="AYAPay">AYA Pay (Mobile Wallet)</option>
                      <option value="CBPay">CB Pay (Mobile Wallet)</option>
                      <option value="BankTransfer">KBZ / CB Bank Transfer</option>
                    </select>
                  </div>

                  {/* Transfer Account Target info */}
                  {(() => {
                    const acc = (paymentInfo?.accounts || []).find((a) => a.method === selectedPaymentMethod) || {
                      accountNumber: '09-977-123-456',
                      accountName: 'TDMS Platform Official Account'
                    }
                    return (
                      <div className="p-3.5 rounded-xl border bg-secondary/30 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-muted-foreground">Transfer to {selectedPaymentMethod}:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(acc.accountNumber, selectedPaymentMethod)}
                            className="text-[11px] text-primary hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedMethod === selectedPaymentMethod ? 'Copied!' : 'Copy Number'}</span>
                          </button>
                        </div>
                        <p className="font-mono text-sm font-bold text-foreground">{acc.accountNumber}</p>
                        <p className="text-[11px] text-muted-foreground">{acc.accountName}</p>
                      </div>
                    )
                  })()}

                  {/* Transaction ID last 6 digits */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">
                      2. Last 6 Digits of Transaction ID <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={trxLast6}
                      onChange={(e) => setTrxLast6(e.target.value)}
                      placeholder="e.g. 849201"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Check your payment completion screen or SMS receipt for the reference number.
                    </p>
                  </div>

                  {/* Payment Screenshot */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">
                      3. Attach Payment Receipt Screenshot <span className="text-destructive">*</span>
                    </label>
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotSelected}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => screenshotInputRef.current?.click()}
                        className="px-4 py-2 text-xs rounded-xl border bg-secondary/50 hover:bg-secondary font-medium transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Choose Screenshot...</span>
                      </button>
                      <div className="text-xs text-muted-foreground truncate flex-1">
                        {proofScreenshotFileName ? (
                          <span className="font-semibold text-foreground">{proofScreenshotFileName}</span>
                        ) : (
                          'No image chosen'
                        )}
                      </div>
                    </div>

                    {proofScreenshotBase64 && (
                      <div className="pt-2 relative w-32 h-24 rounded-xl border overflow-hidden">
                        <img
                          src={proofScreenshotBase64}
                          alt="Receipt Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Optional notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">4. Optional Notes</label>
                    <input
                      type="text"
                      value={purchaseNotes}
                      onChange={(e) => setPurchaseNotes(e.target.value)}
                      placeholder="e.g. Sender phone number or account name"
                      className="w-full px-3 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setPurchasingPkg(null)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={purchaseSubscriptionMutation.isPending || !proofScreenshotBase64 || !trxLast6.trim()}
                      className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {purchaseSubscriptionMutation.isPending ? 'Submitting...' : 'Submit Payment Proof'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
