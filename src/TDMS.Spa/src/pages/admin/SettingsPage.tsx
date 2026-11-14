import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import {
  Sliders,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Calculator
} from 'lucide-react'

interface MatchingWeights {
  subjectWeight?: number
  feeWeight?: number
  scheduleWeight?: number
  modeWeight?: number
  w_subject?: number
  w_fee?: number
  w_schedule?: number
  w_mode?: number
  W_subject?: number
  W_fee?: number
  W_schedule?: number
  W_mode?: number
}

interface SettingsResponse {
  weights?: MatchingWeights
  updatedAt?: string | null
}

const safeNumber = (val: any, fallback: number): number => {
  if (typeof val === 'number' && !isNaN(val)) return val
  const parsed = Number(val)
  return isNaN(parsed) ? fallback : parsed
}

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [subjectWeight, setSubjectWeight] = useState<number>(40)
  const [feeWeight, setFeeWeight] = useState<number>(25)
  const [scheduleWeight, setScheduleWeight] = useState<number>(20)
  const [modeWeight, setModeWeight] = useState<number>(15)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { isLoading } = useQuery<SettingsResponse>({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const res = await api.get<SettingsResponse>('/api/admin/settings')
      if (res?.weights) {
        const w = res.weights as any
        const s = safeNumber(w.subjectWeight ?? w.w_subject ?? w.W_subject, 40)
        const f = safeNumber(w.feeWeight ?? w.w_fee ?? w.W_fee, 25)
        const sc = safeNumber(w.scheduleWeight ?? w.w_schedule ?? w.W_schedule, 20)
        const m = safeNumber(w.modeWeight ?? w.w_mode ?? w.W_mode, 15)

        setSubjectWeight(s)
        setFeeWeight(f)
        setScheduleWeight(sc)
        setModeWeight(m)
      }
      return res
    },
  })

  const s = safeNumber(subjectWeight, 0)
  const f = safeNumber(feeWeight, 0)
  const sc = safeNumber(scheduleWeight, 0)
  const m = safeNumber(modeWeight, 0)

  const totalSum = Math.round(s + f + sc + m)
  const isValidSum = totalSum === 100
  const diff = 100 - totalSum
  const diffText = diff > 0 ? `${diff}% under` : `+${Math.abs(diff)}% over`

  const saveMutation = useMutation({
    mutationFn: (payload: { weights: MatchingWeights }) =>
      api.put('/api/admin/settings', payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] })
      setSuccessMsg(res.message || 'Matching algorithm weights successfully updated.')
      setErrorMsg(null)
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to update matching weights')
    },
  })

  const handleSave = () => {
    if (!isValidSum) {
      setErrorMsg(`Weights must sum to exactly 100%. Current total is ${totalSum}%.`)
      return
    }
    setErrorMsg(null)
    setSuccessMsg(null)
    saveMutation.mutate({
      weights: {
        w_subject: s,
        w_fee: f,
        w_schedule: sc,
        w_mode: m,
        subjectWeight: s,
        feeWeight: f,
        scheduleWeight: sc,
        modeWeight: m,
      },
    })
  }

  const handleResetDefaults = () => {
    setSubjectWeight(40)
    setFeeWeight(25)
    setScheduleWeight(20)
    setModeWeight(15)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matching Engine Settings</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border hover:bg-secondary text-xs font-semibold text-muted-foreground transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults (40/25/20/15)</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidSum || saveMutation.isPending || isLoading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save Formula Weights</span>
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

      {/* Sum Indicator Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${isValidSum
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
          : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
      >
        <div className="flex items-center space-x-3">
          {isValidSum ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <div>
            <p className="font-bold text-sm">
              Total Weight Sum: {totalSum}% {isValidSum ? '✓ Valid (100%)' : '✗ Invalid (Must equal 100%)'}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isValidSum
                ? 'All four criteria are proportionally balanced for deterministic matching scoring.'
                : `Adjust individual criteria weights so their total reaches exactly 100% (currently ${diffText}).`}
            </p>
          </div>
        </div>
      </div>

      {/* Weights Configuration Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Weight */}
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Subject Relevance (W_subject)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact subject match = 100%, category match = 70%, no match = 0%
              </p>
            </div>
            <span className="font-mono text-2xl font-extrabold text-primary">{s}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={s}
            onChange={(e) => setSubjectWeight(Number(e.target.value) || 0)}
            className="w-full accent-primary cursor-pointer"
          />
        </div>

        {/* Fee Weight */}
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Fee Budget Fit (W_fee)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Within budget = 100%, linear decay up to 1.5x max budget
              </p>
            </div>
            <span className="font-mono text-2xl font-extrabold text-primary">{f}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={f}
            onChange={(e) => setFeeWeight(Number(e.target.value) || 0)}
            className="w-full accent-primary cursor-pointer"
          />
        </div>

        {/* Schedule Weight */}
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Schedule Overlap (W_schedule)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculates overlapping day/time availability slot ratio
              </p>
            </div>
            <span className="font-mono text-2xl font-extrabold text-primary">{sc}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={sc}
            onChange={(e) => setScheduleWeight(Number(e.target.value) || 0)}
            className="w-full accent-primary cursor-pointer"
          />
        </div>

        {/* Mode Weight */}
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Teaching Mode Fit (W_mode)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Online vs In-Person matching, or 'Both' wildcard compatibility
              </p>
            </div>
            <span className="font-mono text-2xl font-extrabold text-primary">{m}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={m}
            onChange={(e) => setModeWeight(Number(e.target.value) || 0)}
            className="w-full accent-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Formula Explanation Card */}
      <div className="p-6 rounded-2xl border bg-secondary/30 space-y-3">
        <h3 className="font-bold text-sm flex items-center space-x-2 text-foreground">
          <Calculator className="w-4 h-4 text-primary" />
          <span>Active Deterministic Formula Specification</span>
        </h3>
        <p className="text-xs text-muted-foreground font-mono bg-card p-3 rounded-xl border">
          Final Compatibility Score = ({s}% &times; S_subject) + ({f}% &times; S_fee) + ({sc}% &times; S_schedule) + ({m}% &times; S_mode) + PrioritySearchBoost
        </p>
        <p className="text-xs text-muted-foreground">
          Any updates saved here immediately take effect on all prospective learner discovery searches across the marketplace without requiring server restart.
        </p>
      </div>
    </div>
  )
}
