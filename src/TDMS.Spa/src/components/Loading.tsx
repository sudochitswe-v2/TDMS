import React from 'react'
import { Loader2, Sparkles, GraduationCap } from 'lucide-react'
import { useIsFetching } from '@tanstack/react-query'

/**
 * Atomic skeleton box with animated pulse
 */
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted/70 dark:bg-muted/40 ${className}`}
      {...props}
    />
  )
}

/**
 * Universal inline or block animated loading spinner
 */
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  center?: boolean
}> = ({ size = 'md', text, className = '', center = false }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
  }

  const spinner = (
    <div className={`inline-flex items-center gap-2.5 ${center ? 'justify-center py-6 w-full' : ''} ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary shrink-0`} />
      {text && <span className="text-xs font-medium text-muted-foreground animate-pulse">{text}</span>}
    </div>
  )

  return spinner
}

/**
 * Full page or large container loading state with branded icon and subtle glow
 */
export const PageLoading: React.FC<{
  text?: string
  subtitle?: string
}> = ({ text = 'Loading data...', subtitle = 'Please wait while we fetch the latest information' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] w-full p-8 text-center space-y-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
          <GraduationCap className="h-8 w-8 animate-bounce text-primary" />
        </div>
        <div className="absolute -inset-1 rounded-3xl bg-primary/20 blur-md -z-10 animate-pulse" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-2">
          <span>{text}</span>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

/**
 * Global top-edge indeterminate progress bar attached to window top
 * Activates whenever any React Query is in flight (isFetching > 0)
 */
export const GlobalTopLoadingBar: React.FC = () => {
  const isFetching = useIsFetching()

  if (isFetching === 0) return null

  return (
    <div
      role="progressbar"
      aria-label="Loading remote data"
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20 overflow-hidden pointer-events-none"
    >
      <div className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary animate-shimmer w-full" />
    </div>
  )
}

/**
 * Skeletons for grid cards (e.g. Tutors search list, Subscription packages, Category cards)
 */
export const CardSkeleton: React.FC<{
  count?: number
  variant?: 'tutor' | 'category' | 'package' | 'simple'
}> = ({ count = 3, variant = 'tutor' }) => {
  const items = Array.from({ length: count })

  if (variant === 'category') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {items.map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border bg-card space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'package') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {items.map((_, i) => (
          <div key={i} className="p-6 rounded-3xl border bg-card space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-36" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-xl mt-4" />
          </div>
        ))}
      </div>
    )
  }

  // Default: Tutor Card Skeleton
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {items.map((_, i) => (
        <div key={i} className="p-5 rounded-3xl border bg-card shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header: Avatar, Name, Hourly rate */}
            <div className="flex items-start space-x-3.5">
              <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            {/* Badges and Subjects */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>

            {/* Bio lines */}
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-4/5" />
            </div>
          </div>

          {/* Action button */}
          <div className="pt-3 border-t">
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Table rows skeleton for all table views (Admin Users, Payments, Reports, Categories)
 */
export const TableSkeleton: React.FC<{
  rows?: number
  cols?: number
  message?: string
}> = ({ rows = 5, cols = 5, message }) => {
  return (
    <>
      {message && (
        <tr>
          <td colSpan={cols} className="py-4 text-center">
            <LoadingSpinner size="sm" text={message} center />
          </td>
        </tr>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton
                className={`h-4 ${
                  c === 0 ? 'w-24' : c === 1 ? 'w-36' : c === cols - 1 ? 'w-16 ml-auto' : 'w-20'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/**
 * Metrics cards skeleton (Dashboard overview KPIs)
 */
export const MetricsGridSkeleton: React.FC<{
  count?: number
}> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl border bg-card space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-4 w-4 rounded-md" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  )
}

/**
 * Detail Profile Skeleton for Tutor Studio, Learner Account & Tutor Detail
 */
export const DetailProfileSkeleton: React.FC<{
  title?: string
}> = ({ title = 'Loading workspace profile...' }) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>{title}</span>
          </p>
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Tabs Bar Skeleton */}
      <div className="flex space-x-2 border-b pb-2 overflow-x-auto no-scrollbar">
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
        <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
      </div>

      {/* Content Form Block Skeleton */}
      <div className="p-6 rounded-3xl border bg-card space-y-5">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
