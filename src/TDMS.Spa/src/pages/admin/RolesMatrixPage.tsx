import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Save,
  Check,
  X,
  AlertCircle,
  HelpCircle
} from 'lucide-react'

interface RoleDetail {
  id: string
  name: string
  description: string | null
  claims: string[]
}

interface RolesMatrixResponse {
  roles: RoleDetail[]
  allPermissions: string[]
  allUIControls: string[]
}

export const RolesMatrixPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [roleClaimsMap, setRoleClaimsMap] = useState<Record<string, Set<string>>>({})
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data, isLoading } = useQuery<RolesMatrixResponse>({
    queryKey: ['rolesMatrix'],
    queryFn: async () => {
      const res = await api.get<RolesMatrixResponse>('/api/admin/roles')
      // Initialize working state for claims
      const initialMap: Record<string, Set<string>> = {}
      res.roles.forEach((r) => {
        initialMap[r.id] = new Set(r.claims)
      })
      setRoleClaimsMap(initialMap)
      if (!selectedRoleId && res.roles.length > 0) {
        setSelectedRoleId(res.roles[0].id)
      }
      return res
    },
  })

  const roles = data?.roles || []
  const allPermissions = data?.allPermissions || []
  const allUIControls = data?.allUIControls || []

  const updateClaimsMutation = useMutation({
    mutationFn: ({ roleId, claims }: { roleId: string; claims: string[] }) =>
      api.put(`/api/admin/roles/${roleId}/claims`, { claims }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['rolesMatrix'] })
      setSuccessMsg(res.message || 'Permissions updated successfully.')
      setErrorMsg(null)
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to update permissions')
    },
  })

  const createRoleMutation = useMutation({
    mutationFn: (body: { name: string; description: string }) =>
      api.post('/api/admin/roles', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolesMatrix'] })
      setSuccessMsg('Role created successfully.')
      setErrorMsg(null)
      setIsCreatingRole(false)
      setNewRoleName('')
      setNewRoleDesc('')
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to create role')
    },
  })

  const handleToggleClaim = (roleId: string, claim: string) => {
    const role = roles.find((r) => r.id === roleId)
    if (role?.name === 'SystemAdmin') {
      setErrorMsg('SystemAdmin role retains 100% of platform permissions and cannot be modified.')
      return
    }

    setRoleClaimsMap((prev) => {
      const current = new Set(prev[roleId] || [])
      if (current.has(claim)) {
        current.delete(claim)
      } else {
        current.add(claim)
      }
      return { ...prev, [roleId]: current }
    })
  }

  const handleSaveClaims = (roleId: string) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    const claims = Array.from(roleClaimsMap[roleId] || [])
    updateClaimsMutation.mutate({ roleId, claims })
  }

  const handleCreateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      setErrorMsg('Role name is required')
      return
    }
    createRoleMutation.mutate({
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
    })
  }

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0]
  const isSystemAdminRole = activeRole?.name === 'SystemAdmin'
  const activeRoleClaims = activeRole ? roleClaimsMap[activeRole.id] || new Set() : new Set()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role & Permission Claim</h1>
        </div>
        <button
          onClick={() => setIsCreatingRole(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Role</span>
        </button>
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
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Create Role Modal */}
      {isCreatingRole && (
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-base flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <span>Define New Security Role</span>
            </h3>
            <button onClick={() => setIsCreatingRole(false)} className="p-1 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleCreateRoleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-muted-foreground">Role Identifier Name *</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. ContentModerator"
                  required
                  className="w-full p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-muted-foreground">Role Description</label>
                <input
                  type="text"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Briefly describe operational responsibilities..."
                  className="w-full p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingRole(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRoleMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Save Role
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role Selector Tabs */}
      <div className="flex items-center space-x-2 border-b overflow-x-auto pb-2">
        {roles.map((role) => {
          const isSelected = (selectedRoleId || roles[0]?.id) === role.id
          return (
            <button
              key={role.id}
              onClick={() => {
                setSelectedRoleId(role.id)
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
            >
              {role.name === 'SystemAdmin' ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>{role.name}</span>
            </button>
          )
        })}
      </div>

      {activeRole && (
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">{activeRole.name}</h2>
                {isSystemAdminRole && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    Full Platform Bypass (Immutable)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeRole.description || 'Custom defined role'}
              </p>
            </div>

            {!isSystemAdminRole && (
              <button
                onClick={() => handleSaveClaims(activeRole.id)}
                disabled={updateClaimsMutation.isPending}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Permissions for {activeRole.name}</span>
              </button>
            )}
          </div>

          {isSystemAdminRole && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>System Protection Rule:</strong> The SystemAdmin role automatically possesses 100% of all registered system permissions and UI navigation controls. Permissions cannot be individually revoked from SystemAdmin to prevent lockouts.
              </span>
            </div>
          )}

          {/* Section A: Resource API Actions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm">Resource API Actions ({allPermissions.length})</h3>
              <span className="text-[10px] font-mono text-muted-foreground">Format: resource:action</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {allPermissions.map((claim) => {
                const isChecked = isSystemAdminRole || activeRoleClaims.has(claim)
                return (
                  <label
                    key={claim}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${isChecked
                      ? 'bg-primary/5 border-primary/30 font-semibold text-primary'
                      : 'bg-background hover:bg-secondary text-muted-foreground'
                      } ${isSystemAdminRole ? 'cursor-not-allowed opacity-90' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isSystemAdminRole}
                      onChange={() => handleToggleClaim(activeRole.id, claim)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="font-mono text-[11px] truncate">{claim}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Section B: UI Navigation Controls */}
          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm">UI & Navigation Elements ({allUIControls.length})</h3>
              <span className="text-[10px] font-mono text-muted-foreground">Format: view:menu:*</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {allUIControls.map((claim) => {
                const isChecked = isSystemAdminRole || activeRoleClaims.has(claim)
                return (
                  <label
                    key={claim}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${isChecked
                      ? 'bg-blue-500/5 border-blue-500/30 font-semibold text-blue-600 dark:text-blue-400'
                      : 'bg-background hover:bg-secondary text-muted-foreground'
                      } ${isSystemAdminRole ? 'cursor-not-allowed opacity-90' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isSystemAdminRole}
                      onChange={() => handleToggleClaim(activeRole.id, claim)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="font-mono text-[11px] truncate">{claim}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
