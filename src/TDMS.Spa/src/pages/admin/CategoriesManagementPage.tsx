import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import { Pagination } from '../../components/Pagination'
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  GraduationCap
} from 'lucide-react'

interface CategoryItem {
  id: number
  name: string
  description: string | null
  isActive: boolean
  tutorCount: number
}

export const CategoriesManagementPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data: categories = [], isLoading } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<CategoryItem[]>('/api/categories'),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; isActive: boolean }) =>
      api.post('/api/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setSuccessMsg('Category created successfully.')
      setErrorMsg(null)
      closeForm()
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to create category')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description: string; isActive: boolean } }) =>
      api.put(`/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setSuccessMsg('Category updated successfully.')
      setErrorMsg(null)
      closeForm()
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to update category')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setSuccessMsg('Category deleted successfully.')
      setErrorMsg(null)
    },
    onError: (err: ApiError) => {
      setErrorMsg(err.message || 'Failed to delete category')
    },
  })

  const startCreate = () => {
    setIsCreating(true)
    setEditingCategory(null)
    setName('')
    setDescription('')
    setIsActive(true)
    setErrorMsg(null)
  }

  const startEdit = (cat: CategoryItem) => {
    setEditingCategory(cat)
    setIsCreating(false)
    setName(cat.name)
    setDescription(cat.description || '')
    setIsActive(cat.isActive)
    setErrorMsg(null)
  }

  const closeForm = () => {
    setIsCreating(false)
    setEditingCategory(null)
    setName('')
    setDescription('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Category name is required')
      return
    }

    if (isCreating) {
      createMutation.mutate({ name: name.trim(), description: description.trim(), isActive })
    } else if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: { name: name.trim(), description: description.trim(), isActive },
      })
    }
  }

  const handleDelete = (cat: CategoryItem) => {
    if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      setErrorMsg(null)
      setSuccessMsg(null)
      deleteMutation.mutate(cat.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subject Categories Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curate academic and vocational subject classifications for tutor indexing and matching
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
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
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {(isCreating || editingCategory) && (
        <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-base flex items-center space-x-2">
              <FolderTree className="w-5 h-5 text-primary" />
              <span>{isCreating ? 'Create Subject Category' : `Edit Category: ${editingCategory?.name}`}</span>
            </h2>
            <button onClick={closeForm} className="p-1 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-muted-foreground">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Higher Level Physics"
                  required
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
                    {isActive ? 'Active (Searchable)' : 'Inactive (Hidden)'}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-muted-foreground">Description & Scope</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Curriculum syllabus coverage, prerequisites, key learning objectives..."
                rows={2}
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
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isCreating ? 'Create Category' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground border-b font-medium">
              <tr>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Active Tutors</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No categories found. Create one above.
                  </td>
                </tr>
              ) : (
                categories
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((cat) => (
                  <tr key={cat.id} className="hover:bg-secondary/20 transition">
                    <td className="py-3 px-4 font-bold text-foreground">
                      <div className="flex items-center space-x-2">
                        <FolderTree className="w-4 h-4 text-primary shrink-0" />
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-foreground">
                        <GraduationCap className="w-3 h-3 mr-1 text-primary" />
                        {cat.tutorCount} {cat.tutorCount === 1 ? 'tutor' : 'tutors'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {cat.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground border">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded-lg border hover:bg-secondary text-foreground"
                        title="Edit category"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive"
                        title="Delete category (blocked if referenced by tutors)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t bg-card">
          <Pagination
            currentPage={currentPage}
            totalItems={categories.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="categories"
            className="pt-0 border-t-0"
          />
        </div>
      </div>
    </div>
  )
}
