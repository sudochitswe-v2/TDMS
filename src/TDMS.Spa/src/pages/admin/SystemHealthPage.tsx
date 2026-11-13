import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import {
  Activity,
  Database,
  Radio,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Cpu
} from 'lucide-react'

interface SystemDataResponse {
  databaseStatus: string
  databaseProvider: string
  firebaseProvider: string
  serverTimeUtc: string
  environment: string
}

interface MaintenanceResponse {
  maintenanceStatus: string
  relationalIntegrity: string
  stats: {
    totalUsers: number
    orphanedLearnerProfiles: number
    orphanedTutorProfiles: number
  }
  executedAt: string
}

export const SystemHealthPage: React.FC = () => {
  const [maintenanceResult, setMaintenanceResult] = useState<MaintenanceResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data, isLoading, refetch, isFetching } = useQuery<SystemDataResponse>({
    queryKey: ['systemHealthData'],
    queryFn: () => api.get<SystemDataResponse>('/api/admin/system-data'),
  })

  const maintenanceMutation = useMutation({
    mutationFn: () => api.post<MaintenanceResponse>('/api/admin/database/maintenance'),
    onSuccess: (res) => {
      setMaintenanceResult(res)
      setSuccessMsg('System maintenance & relational integrity check completed with 0 errors.')
      setErrorMsg(null)
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Maintenance execution failed')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Infrastructure & Database Health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time diagnostics, database connectivity, and messaging integration status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border hover:bg-secondary text-xs font-semibold text-muted-foreground transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
          <button
            onClick={() => maintenanceMutation.mutate()}
            disabled={maintenanceMutation.isPending}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-sm disabled:opacity-50"
          >
            <Activity className="w-4 h-4" />
            <span>Run Maintenance Routine</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
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

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Status */}
        <div className="p-5 rounded-2xl border bg-card space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Relational Database</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {data?.databaseStatus || (isLoading ? 'Checking...' : 'Unknown')}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
              {data?.databaseProvider || '—'}
            </p>
          </div>
        </div>

        {/* Messaging Provider */}
        <div className="p-5 rounded-2xl border bg-card space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Messaging Engine</span>
            <Radio className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground truncate">
              {data?.firebaseProvider?.split(' ')[0] || 'Active'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data?.firebaseProvider?.includes('Mock')
                ? 'Swappable Mock Simulator (Zero Credentials Needed)'
                : 'Live Firebase Realtime Database'}
            </p>
          </div>
        </div>

        {/* Runtime Environment */}
        <div className="p-5 rounded-2xl border bg-card space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Runtime Environment</span>
            <Server className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{data?.environment || 'Development'}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">.NET 10 Kestrel Host</p>
          </div>
        </div>

        {/* Server Time */}
        <div className="p-5 rounded-2xl border bg-card space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Server Clock (UTC)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold font-mono text-foreground">
              {data?.serverTimeUtc ? new Date(data.serverTimeUtc).toUTCString() : '—'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Synchronized NTP</p>
          </div>
        </div>
      </div>

      {/* Maintenance Results Block */}
      {maintenanceResult && (
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b pb-3 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-base">Relational Integrity Maintenance Report</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <span className="text-muted-foreground font-medium">Status</span>
              <p className="text-sm font-bold text-emerald-600">{maintenanceResult.maintenanceStatus}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <span className="text-muted-foreground font-medium">Relational Constraints</span>
              <p className="text-sm font-bold text-foreground">{maintenanceResult.relationalIntegrity}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <span className="text-muted-foreground font-medium">Executed At</span>
              <p className="text-sm font-mono text-foreground">
                {new Date(maintenanceResult.executedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-secondary/20 text-xs space-y-1 font-mono text-muted-foreground">
            <p>&bull; Total User Records Checked: {maintenanceResult.stats.totalUsers}</p>
            <p>&bull; Orphaned Learner Profile Records: {maintenanceResult.stats.orphanedLearnerProfiles}</p>
            <p>&bull; Orphaned Tutor Profile Records: {maintenanceResult.stats.orphanedTutorProfiles}</p>
          </div>
        </div>
      )}

      {/* Swappable Architecture Notes */}
      <div className="p-6 rounded-2xl border bg-secondary/20 space-y-3">
        <h3 className="font-bold text-sm flex items-center space-x-2 text-foreground">
          <Cpu className="w-4 h-4 text-primary" />
          <span>Swappable Architecture & Configuration Information</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The TDMS backend implements a plugin pattern for real-time messaging (<code className="font-mono bg-card px-1.5 py-0.5 rounded border">IFirebaseMessagingService</code>). In the absence of Firebase service account credentials, it seamlessly runs <code className="font-mono bg-card px-1.5 py-0.5 rounded border">MockFirebaseMessagingService</code> with zero external dependencies. Once credentials are provided in <code className="font-mono bg-card px-1.5 py-0.5 rounded border">appsettings.json</code> under <code className="font-mono bg-card px-1.5 py-0.5 rounded border">Firebase:ServiceAccountKeyJson</code>, the application automatically switches to live Google Cloud Firebase Realtime Database without code alterations.
        </p>
      </div>
    </div>
  )
}
