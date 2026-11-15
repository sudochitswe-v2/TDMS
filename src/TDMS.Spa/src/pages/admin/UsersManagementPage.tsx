import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import { Pagination } from '../../components/Pagination'
import { TableSkeleton } from '../../components/Loading'
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  KeyRound,
  AlertTriangle,
  X,
  Check
} from 'lucide-react'

interface UserItem {
  id: string
  fullName: string
  email: string
  userName: string
  isActive: boolean
  createdAt: string
  roles: string[]
  accountType: string
  tutorStatus: string | null
}

interface RoleItem {
  id: string
  name: string
  description: string | null
}

interface RolesResponse {
  roles: RoleItem[]
}

export const UsersManagementPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingUserRoles, setEditingUserRoles] = useState<UserItem | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ['adminUsers'],
    queryFn: () => api.get<UserItem[]>('/api/admin/users'),
  })

  const { data: rolesData } = useQuery<RolesResponse>({
    queryKey: ['adminRolesList'],
    queryFn: () => api.get<RolesResponse>('/api/admin/roles'),
  })

  const availableRoles = rolesData?.roles || []

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.put(`/api/admin/users/${userId}/status`, { isActive }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      setSuccessMsg(data.message || 'User status updated successfully.')
      setErrorMsg(null)
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to update user status')
    },
  })

  const rolesMutation = useMutation({
    mutationFn: ({ userId, roleNames }: { userId: string; roleNames: string[] }) =>
      api.put(`/api/admin/users/${userId}/roles`, { roleNames }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      setSuccessMsg(data.message || 'User roles updated successfully.')
      setErrorMsg(null)
      setEditingUserRoles(null)
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to update user roles')
    },
  })

  const handleToggleStatus = (user: UserItem) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    const targetStatus = !user.isActive
    statusMutation.mutate({ userId: user.id, isActive: targetStatus })
  }

  const handleOpenRoleModal = (user: UserItem) => {
    setEditingUserRoles(user)
    setSelectedRoles([...user.roles])
    setErrorMsg(null)
  }

  const handleToggleRoleSelection = (roleName: string) => {
    if (selectedRoles.includes(roleName)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleName))
    } else {
      setSelectedRoles([...selectedRoles, roleName])
    }
  }

  const handleSaveRoles = () => {
    if (!editingUserRoles) return
    setErrorMsg(null)
    rolesMutation.mutate({
      userId: editingUserRoles.id,
      roleNames: selectedRoles,
    })
  }

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.userName.toLowerCase().includes(q)
    const matchesRole = roleFilter === 'ALL' || u.roles.includes(roleFilter)
    return matchesSearch && matchesRole
  })

  const paginatedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Account Governance</h1>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by full name, email, or username..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-2 text-sm rounded-xl border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="ALL">All Roles</option>
          {availableRoles.map((r) => (
            <option key={r.id} value={r.name}>
              Role: {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground border-b font-medium">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton rows={6} cols={5} message="Loading platform users..." />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isSysAdmin = user.roles.includes('SystemAdmin')
                  return (
                    <tr key={user.id} className="hover:bg-secondary/20 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">{user.fullName}</div>
                        <div className="text-[11px] text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-foreground">{user.accountType}</span>
                        {user.tutorStatus && (
                          <span className="block text-[10px] text-muted-foreground">
                            Status: {user.tutorStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${role === 'SystemAdmin'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-secondary text-foreground border'
                                }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenRoleModal(user)}
                          className="p-1.5 rounded-lg border hover:bg-secondary text-foreground inline-flex items-center space-x-1"
                          title="Manage Roles"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-primary" />
                          <span className="hidden sm:inline text-[11px]">Roles</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={statusMutation.isPending}
                          className={`p-1.5 rounded-lg border text-xs font-semibold inline-flex items-center space-x-1 ${user.isActive
                              ? 'text-destructive border-destructive/20 hover:bg-destructive/10'
                              : 'text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10'
                            }`}
                          title={user.isActive ? 'Suspend User' : 'Reactivate User'}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">Suspend</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">Activate</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t bg-card">
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="user accounts"
            className="pt-0 border-t-0"
          />
        </div>
      </div>

      {/* Edit User Roles Modal */}
      {editingUserRoles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base">Assign Roles</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{editingUserRoles.fullName} ({editingUserRoles.email})</p>
              </div>
              <button onClick={() => setEditingUserRoles(null)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select roles to assign to this user. Each assigned role injects discrete permission claims into their JWT on subsequent logins.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {availableRoles.map((role) => {
                const checked = selectedRoles.includes(role.name)
                return (
                  <label
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition text-xs"
                  >
                    <div>
                      <p className="font-bold text-foreground">{role.name}</p>
                      <p className="text-[11px] text-muted-foreground">{role.description || 'System Role'}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleRoleSelection(role.name)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t">
              <button
                onClick={() => setEditingUserRoles(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={rolesMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Save Role Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
