import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatTimeAmPm } from '../lib/formatters'
import { useAuth } from '../context/AuthContext'
import { DetailProfileSkeleton } from '../components/Loading'
import { TimeSelect } from '../components/TimeSelect'
import {
  BookOpen,
  Calendar,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers
} from 'lucide-react'

interface ScheduleSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface LearnerProfile {
  id: string
  userId: string
  accountSubType: string
  gradeLevel?: string
  preferredMaxHourlyFee: number
  preferredTeachingMode: string
  learningGoalsNote?: string
  categoryIds: number[]
  scheduleSlots: ScheduleSlot[]
}

interface CategoryItem {
  id: number
  name: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const LearnerAccountPage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'schedule' | 'goals'>('profile')
  const [accountSubType, setAccountSubType] = useState<'Parent' | 'Student'>('Student')
  const [gradeLevel, setGradeLevel] = useState('')
  const [preferredMaxHourlyFee, setPreferredMaxHourlyFee] = useState(35000)
  const [preferredTeachingMode, setPreferredTeachingMode] = useState('Both')
  const [learningGoalsNote, setLearningGoalsNote] = useState('')
  const [categoryIds, setCategoryIds] = useState<number[]>([])
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [successMessage, setSuccessMessage] = useState('')

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories'),
  })

  const { data: profile, isLoading } = useQuery<LearnerProfile>({
    queryKey: ['learnerProfile'],
    queryFn: () => api.get('/api/account/learner-profile'),
  })

  useEffect(() => {
    if (profile) {
      setAccountSubType(profile.accountSubType === 'Parent' ? 'Parent' : 'Student')
      setGradeLevel(profile.gradeLevel || '')
      setPreferredMaxHourlyFee(profile.preferredMaxHourlyFee || 35000)
      setPreferredTeachingMode(profile.preferredTeachingMode || 'Both')
      setLearningGoalsNote(profile.learningGoalsNote || '')
      setCategoryIds(profile.categoryIds || [])
      setScheduleSlots(profile.scheduleSlots || [])
    }
  }, [profile])

  const mutation = useMutation({
    mutationFn: (updated: any) => api.put('/api/account/learner-profile', updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerProfile'] })
      queryClient.invalidateQueries({ queryKey: ['tutorsSearch'] })
      setSuccessMessage('Learner requirements updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
  })

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    mutation.mutate({
      accountSubType,
      gradeLevel: gradeLevel || null,
      preferredMaxHourlyFee,
      preferredTeachingMode,
      learningGoalsNote: learningGoalsNote || null,
      categoryIds,
      scheduleSlots,
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
      { dayOfWeek: 1, startTime: '16:00', endTime: '18:00' },
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
    return <DetailProfileSkeleton title="Loading learner profile requirements..." />
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Learner Requirements & Profile</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {accountSubType} Account
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your tutoring criteria to get precision match scoring in the tutor directory
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={mutation.isPending}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm flex items-center justify-center space-x-2 shrink-0 cursor-pointer active:scale-95"
        >
          <Save className="h-4 w-4" />
          <span>{mutation.isPending ? 'Saving...' : 'Save Requirements'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Responsive Tab Bar (Sticky, Touch-Friendly, No Ugly Scrollbars) */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Profile & Style</span>
            <span className="sm:hidden">Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Subject Needs</span>
            <span className="sm:hidden">Subjects</span>
            {categoryIds.length > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                  activeTab === 'categories' ? 'bg-primary-foreground text-primary' : 'bg-primary/15 text-primary'
                }`}
              >
                {categoryIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Study Availability</span>
            <span className="sm:hidden">Schedule</span>
            {scheduleSlots.length > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                  activeTab === 'schedule' ? 'bg-primary-foreground text-primary' : 'bg-primary/15 text-primary'
                }`}
              >
                {scheduleSlots.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap active:scale-95 touch-manipulation cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Goals & Notes</span>
            <span className="sm:hidden">Goals</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Profile & Learning Style */}
        {activeTab === 'profile' && (
          <div className="p-5 sm:p-6 rounded-2xl border bg-card space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <span>Profile & Learning Style</span>
              </h2>
              <span className="text-xs text-muted-foreground">Step 1 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Account Role</label>
                <select
                  value={accountSubType}
                  onChange={(e) => setAccountSubType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                >
                  <option value="Student">Student</option>
                  <option value="Parent">Parent / Guardian</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Target Grade / Level</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g. Grade 11 / A-Levels"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                >
                </input>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Preferred Mode</label>
                <select
                  value={preferredTeachingMode}
                  onChange={(e) => setPreferredTeachingMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                >
                  <option value="Both">Both (Flexible)</option>
                  <option value="Online">Online Only</option>
                  <option value="InPerson">In-Person Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Preferred Maximum Hourly Budget</span>
                <span className="text-primary font-bold">{preferredMaxHourlyFee.toLocaleString()} MMK / hr</span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="5000"
                value={preferredMaxHourlyFee}
                onChange={(e) => setPreferredMaxHourlyFee(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground">
                Tutors with hourly fees up to {preferredMaxHourlyFee.toLocaleString()} MMK achieve 100% fee compatibility score.
              </p>
            </div>

            {/* Bottom Step Switcher */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div />
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold transition"
              >
                <span>Continue to Subjects</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Required Subject Categories */}
        {activeTab === 'categories' && (
          <div className="p-5 sm:p-6 rounded-2xl border bg-card space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Target Subject Requirements</span>
              </h2>
              <span className="text-xs text-muted-foreground">Step 2 of 4</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Select the subjects where you need tutoring. TDMS will prioritize verified educators specializing in these areas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((c) => {
                const selected = categoryIds.includes(c.id)
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between cursor-pointer active:scale-98 ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary shadow-2xs'
                        : 'bg-secondary/30 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span>{c.name}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border hover:bg-secondary text-xs font-semibold transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold transition"
              >
                <span>Continue to Schedule</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Study Schedule Slots */}
        {activeTab === 'schedule' && (
          <div className="p-5 sm:p-6 rounded-2xl border bg-card space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-base font-bold flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Preferred Study Availability Slots</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Specify weekly recurring study windows so tutors can check calendar compatibility
                </p>
              </div>

              <button
                type="button"
                onClick={addSlot}
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-xs font-semibold transition shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Weekly Slot</span>
              </button>
            </div>

            {scheduleSlots.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-2xl text-xs text-muted-foreground space-y-2">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <p>No recurring study slots added yet.</p>
                <p className="text-[11px]">Click "Add Weekly Slot" above to define your weekly study hours.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {scheduleSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border bg-secondary/20 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3 transition"
                  >
                    {/* Top Row on mobile: Day selector + Delete button */}
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

                    {/* Bottom Row on mobile: Time selector with AM/PM selector + Formatted Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                        <TimeSelect
                          value={slot.startTime}
                          onChange={(val) => updateSlot(idx, 'startTime', val)}
                          ariaLabelPrefix={`Study Slot ${idx + 1} Start`}
                        />
                        <span className="text-xs text-muted-foreground font-medium px-0.5">to</span>
                        <TimeSelect
                          value={slot.endTime}
                          onChange={(val) => updateSlot(idx, 'endTime', val)}
                          ariaLabelPrefix={`Study Slot ${idx + 1} End`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-primary px-2.5 py-1 rounded-md bg-primary/10 whitespace-nowrap">
                        {formatTimeAmPm(slot.startTime)} – {formatTimeAmPm(slot.endTime)}
                      </span>
                    </div>

                    {/* Desktop Trash Button */}
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
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border hover:bg-secondary text-xs font-semibold transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('goals')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold transition"
              >
                <span>Continue to Goals</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Goals & Notes */}
        {activeTab === 'goals' && (
          <div className="p-5 sm:p-6 rounded-2xl border bg-card space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Academic Goals & Special Notes</span>
              </h2>
              <span className="text-xs text-muted-foreground">Step 4 of 4</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Share details regarding upcoming tests, matriculation deadlines, learning difficulties, or topics you want to prioritize with educators.
            </p>

            <textarea
              rows={4}
              value={learningGoalsNote}
              onChange={(e) => setLearningGoalsNote(e.target.value)}
              placeholder="Describe specific areas of improvement, exam deadlines, or special requirements..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border hover:bg-secondary text-xs font-semibold transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={mutation.isPending}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>{mutation.isPending ? 'Saving...' : 'Finish & Save'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
