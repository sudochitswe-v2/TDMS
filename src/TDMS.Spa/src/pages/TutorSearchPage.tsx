import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Pagination } from '../components/Pagination'
import {
  Search,
  Filter,
  Star,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  GraduationCap,
  SlidersHorizontal,
  X
} from 'lucide-react'

interface TutorCard {
  id: string
  userId: string
  fullName: string
  headline?: string
  biography?: string
  yearsOfExperience: number
  hourlyFee: number
  teachingMode: string
  verificationStatus: string
  profilePictureUrl?: string | null
  averageRating: number
  totalReviewsCount: number
  matchScore: number
  categories: string[]
  tierName?: string
  priorityBoost: number
}

interface CategoryItem {
  id: number
  name: string
}

export const TutorSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [categoryId, setCategoryId] = useState<string>(searchParams.get('categoryId') || '')
  const [maxFee, setMaxFee] = useState<number>(Number(searchParams.get('maxFee')) || 50000)
  const [teachingMode, setTeachingMode] = useState<string>(searchParams.get('teachingMode') || '')
  const [dayOfWeek, setDayOfWeek] = useState<string>(searchParams.get('dayOfWeek') || '')
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(6)

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '')
    if (searchParams.get('categoryId') !== null) {
      setCategoryId(searchParams.get('categoryId') || '')
    }
    setCurrentPage(1)
  }, [searchParams])

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories'),
  })

  // Build query string
  const queryParams = new URLSearchParams()
  if (categoryId) queryParams.set('categoryId', categoryId)
  if (maxFee) queryParams.set('maxFee', maxFee.toString())
  if (teachingMode) queryParams.set('teachingMode', teachingMode)
  if (dayOfWeek) queryParams.set('dayOfWeek', dayOfWeek)
  if (searchTerm) queryParams.set('search', searchTerm)

  const { data: tutors = [], isLoading } = useQuery<TutorCard[]>({
    queryKey: ['tutorsSearch', queryParams.toString()],
    queryFn: () => api.get(`/api/tutors/search?${queryParams.toString()}`),
  })

  const paginatedTutors = tutors.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleApplyFilters = () => {
    setSearchParams(queryParams)
    setShowMobileFilters(false)
  }

  const handleResetFilters = () => {
    setCategoryId('')
    setMaxFee(50000)
    setTeachingMode('')
    setDayOfWeek('')
    setSearchTerm('')
    setSearchParams({})
  }

  const getMatchScoreBadge = (score: number) => {
    if (score >= 80) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    } else if (score >= 60) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    }
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl space-y-6 sm:space-y-8">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tutor Directory</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Ranked by match compatibility across subject relevance, tuition budget, and schedule availability
          </p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border bg-card text-xs font-semibold shadow-xs"
        >
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>{showMobileFilters ? 'Hide Filters' : 'Filter Tutors'}</span>
        </button>
      </div>

      {/* Main Grid: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Left Filter Sidebar */}
        <div
          className={`${
            showMobileFilters ? 'block' : 'hidden'
          } lg:block lg:col-span-1 space-y-5 bg-card p-5 rounded-2xl border shadow-xs h-fit`}
        >
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center space-x-2 font-semibold text-sm">
              <Filter className="h-4 w-4 text-primary" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Reset
            </button>
          </div>

          {/* Search Term */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Keywords / Tutor Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Subject Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Subject Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Max Hourly Budget */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-semibold">Max Hourly Budget</label>
              <span className="font-bold text-primary">{maxFee.toLocaleString()} MMK</span>
            </div>
            <input
              type="range"
              min="5000"
              max="100000"
              step="5000"
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground">
              Scores decay linearly if a tutor's fee exceeds this budget.
            </p>
          </div>

          {/* Teaching Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Teaching Mode</label>
            <select
              value={teachingMode}
              onChange={(e) => setTeachingMode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Any Mode</option>
              <option value="Online">Online Only</option>
              <option value="InPerson">In-Person Only</option>
              <option value="Both">Both (Hybrid)</option>
            </select>
          </div>

          {/* Day of Week */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Day of Week</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Any Day</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="0">Sunday</option>
            </select>
          </div>

          <button
            onClick={handleApplyFilters}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:opacity-90 transition shadow-xs cursor-pointer"
          >
            Apply Filters
          </button>
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {tutors.length} verified educators</span>
            <span>Ranked by Match Score</span>
          </div>

          {isLoading && (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Loading tutors and calculating compatibility scores...
            </div>
          )}

          {!isLoading && tutors.length === 0 && (
            <div className="p-12 text-center border rounded-2xl bg-card space-y-3">
              <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold text-base">No Matching Tutors Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No tutors match your active filters. Try increasing your maximum MMK budget or selecting 'Any Mode'.
              </p>
            </div>
          )}

          {!isLoading &&
            paginatedTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="p-5 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  <div className="shrink-0 mt-0.5">
                    {tutor.profilePictureUrl ? (
                      <img
                        src={tutor.profilePictureUrl}
                        alt={tutor.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-primary/20 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-bold text-xs text-muted-foreground border">
                        {tutor.fullName?.slice(0, 2).toUpperCase() || 'TU'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base sm:text-lg">{tutor.fullName}</h3>
                      <span className="flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Verified</span>
                      </span>
                      {tutor.tierName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {tutor.tierName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {tutor.headline || 'Independent Educator'} &bull; {tutor.yearsOfExperience} yrs experience
                    </p>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tutor.biography || 'Specialized in customized student-centered tutoring sessions.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {tutor.categories.map((c, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                          {c}
                        </span>
                      ))}
                      <span className="text-[11px] px-2 py-0.5 rounded-md border text-muted-foreground font-medium">
                        Mode: {tutor.teachingMode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Action Side */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 gap-3 shrink-0">
                  {/* Match Score Badge */}
                  <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full border text-xs font-bold ${getMatchScoreBadge(tutor.matchScore)}`}>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{tutor.matchScore}% Match</span>
                  </div>

                  {/* Hourly Fee in MMK */}
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-extrabold text-foreground">
                      {tutor.hourlyFee.toLocaleString()} MMK
                    </span>
                    <span className="text-xs text-muted-foreground"> / hr</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 text-xs text-amber-500 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>{tutor.averageRating > 0 ? tutor.averageRating.toFixed(1) : 'New'}</span>
                    <span className="text-muted-foreground font-normal">({tutor.totalReviewsCount})</span>
                  </div>

                  <Link
                    to={`/tutors/${tutor.id}`}
                    className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition shadow-xs"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}

          {/* Pagination Controls */}
          {!isLoading && tutors.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={tutors.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 12, 24, 48]}
              itemLabel="verified educators"
              className="mt-6"
            />
          )}
        </div>
      </div>
    </div>
  )
}
