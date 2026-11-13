import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  Search,
  Sparkles,
  BookOpen,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Banknote,
  GraduationCap
} from 'lucide-react'

interface CategoryItem {
  id: number
  name: string
  description?: string
  tutorCount: number
}

export const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories'),
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/tutors?search=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      navigate('/tutors')
    }
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-12 sm:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl text-center space-y-5 sm:space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Smart Tutor Matching & Verified Educators</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Find Verified Tutors for <span className="text-primary">Your Exact Goals</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Personalized 1-on-1 tutoring matched to your subjects, budget, and weekly schedule.
          </p>

          {/* Quick Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl mx-auto bg-card border rounded-2xl p-2 shadow-sm"
          >
            <div className="flex items-center space-x-2 px-3 py-2 w-full">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Subject or tutor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition shadow-xs shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Core Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6 text-left">
            <div className="p-3 sm:p-4 rounded-xl border bg-card space-y-1">
              <div className="flex items-center space-x-2 text-primary">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-xs font-bold text-foreground">Verified Tutors</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Certified qualifications</p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border bg-card space-y-1">
              <div className="flex items-center space-x-2 text-primary">
                <Calendar className="h-4 w-4 shrink-0 text-blue-500" />
                <span className="text-xs font-bold text-foreground">Schedule Match</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Compatible time slots</p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border bg-card space-y-1">
              <div className="flex items-center space-x-2 text-primary">
                <Banknote className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="text-xs font-bold text-foreground">MMK Pricing</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Direct local rates</p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border bg-card space-y-1">
              <div className="flex items-center space-x-2 text-primary">
                <BookOpen className="h-4 w-4 shrink-0 text-purple-500" />
                <span className="text-xs font-bold text-foreground">Direct Chat</span>
              </div>
              <p className="text-[11px] text-muted-foreground">In-app messaging</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="container mx-auto px-4 max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Popular Subjects</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Explore educators across top academic and vocational subjects</p>
          </div>
          <Link
            to="/tutors"
            className="flex items-center space-x-1 text-xs sm:text-sm font-semibold text-primary hover:underline shrink-0"
          >
            <span>All Tutors</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              to={`/tutors?categoryId=${cat.id}`}
              className="group p-5 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition">{cat.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground shrink-0">
                    {cat.tutorCount} {cat.tutorCount === 1 ? 'Tutor' : 'Tutors'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cat.description || 'Expert private coaching'}</p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold text-primary">
                <span>View Tutors</span>
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="rounded-3xl border bg-card p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center sm:text-left max-w-xl">
            <h2 className="text-xl sm:text-2xl font-bold">Teach on TDMS</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Set your own hourly MMK fee, manage your availability calendar, and connect with students and parents seeking expert guidance.
            </p>
          </div>
          <Link
            to="/register/tutor"
            className="w-full sm:w-auto text-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:opacity-90 transition shadow-xs shrink-0"
          >
            Register as Tutor
          </Link>
        </div>
      </section>
    </div>
  )
}
