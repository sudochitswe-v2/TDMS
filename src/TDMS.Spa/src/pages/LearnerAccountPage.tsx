import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatTimeAmPm } from '../lib/formatters'
import { useAuth } from '../context/AuthContext'
import {
  BookOpen,
  Calendar,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  UserCheck,
  AlertCircle
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
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
    return (
      <div className="container mx-auto px-4 py-20 text-center text-sm text-muted-foreground">
        Loading learner profile requirements...
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight">Learner Requirements & Profile</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {accountSubType} Account
            </span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm flex items-center justify-center space-x-2 shrink-0"
        >
          <Save className="h-4 w-4" />
          <span>{mutation.isPending ? 'Saving...' : 'Save Requirements'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Preferences */}
        <div className="p-6 rounded-2xl border bg-card space-y-4">
          <h2 className="text-base font-bold flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span>Profile & Learning Style</span>
          </h2>

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
              />
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
            <p className="text-[10px] text-muted-foreground">
              Tutors with hourly fees up to {preferredMaxHourlyFee.toLocaleString()} MMK achieve 100% fee compatibility score.
            </p>
          </div>
        </div>

        {/* Required Subject Categories */}
        <div className="p-6 rounded-2xl border bg-card space-y-4">
          <h2 className="text-base font-bold flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Target Subject Requirements</span>
          </h2>

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

        {/* Study Schedule Slots */}
        <div className="p-6 rounded-2xl border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Preferred Study Availability Slots</span>
            </h2>
            <button
              type="button"
              onClick={addSlot}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-secondary transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Weekly Slot</span>
            </button>
          </div>

          {scheduleSlots.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recurring study slots added yet.</p>
          ) : (
            <div className="space-y-2">
              {scheduleSlots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/20">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateSlot(idx, 'dayOfWeek', Number(e.target.value))}
                    className="px-2 py-1.5 text-xs rounded-lg border bg-background"
                  >
                    {DAYS.map((d, i) => (
                      <option key={i} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border bg-background"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border bg-background"
                    />
                    <span className="text-xs font-medium text-primary px-2 py-0.5 rounded-md bg-primary/10 whitespace-nowrap">
                      {formatTimeAmPm(slot.startTime)} – {formatTimeAmPm(slot.endTime)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals Note */}
        <div className="p-6 rounded-2xl border bg-card space-y-2">
          <label className="text-xs font-semibold">Academic Goals & Notes</label>
          <textarea
            rows={3}
            value={learningGoalsNote}
            onChange={(e) => setLearningGoalsNote(e.target.value)}
            placeholder="Describe specific areas of improvement, exam deadlines, or special requirements..."
            className="w-full px-3 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </form>
    </div>
  )
}
