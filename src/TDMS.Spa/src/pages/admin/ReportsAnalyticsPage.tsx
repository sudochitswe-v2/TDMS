import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Pagination } from '../../components/Pagination'
import { TableSkeleton } from '../../components/Loading'
import {
  TrendingUp,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react'

interface DemandSupplyItem {
  categoryId: string | number
  categoryName: string
  searchDemandCount: number
  tutorSupplyCount: number
  demandSupplyRatio: number
}

interface ReportsResponse {
  summary: {
    totalUsers: number
    totalLearners: number
    totalTutors: number
    verifiedTutors: number
    pendingTutors: number
    totalInquiries: number
    acceptedInquiries: number
    totalReviews: number
  }
  categoryDemandSupply: DemandSupplyItem[]
}

export const ReportsAnalyticsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = useQuery<ReportsResponse>({
    queryKey: ['reportsAnalytics'],
    queryFn: () => api.get<ReportsResponse>('/api/operations/reports'),
  })

  const demandSupply = data?.categoryDemandSupply || []

  return (
    <div className="space-y-6">

      {/* Demand vs Supply Intelligence Table Card */}
      <div className="rounded-2xl border bg-card shadow-sm space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
          <div>
            <h2 className="font-bold text-base flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Subject Category Market Ratios</span>
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground border-b font-medium">
              <tr>
                <th className="py-3 px-4">Subject Category</th>
                <th className="py-3 px-4">Search Demand</th>
                <th className="py-3 px-4">Tutor Supply</th>
                <th className="py-3 px-4">Demand / Supply Ratio</th>
                <th className="py-3 px-4">Market Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton rows={5} cols={5} message="Calculating marketplace analytics..." />
              ) : demandSupply.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No category data available yet.
                  </td>
                </tr>
              ) : (
                demandSupply
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => {
                    let badge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        Balanced Market
                      </span>
                    )
                    if (item.demandSupplyRatio > 2.0) {
                      badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center w-fit space-x-1">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>High Demand (Recruit Tutors)</span>
                        </span>
                      )
                    } else if (item.tutorSupplyCount === 0 && item.searchDemandCount > 0) {
                      badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 flex items-center w-fit space-x-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Zero Supply Bottleneck</span>
                        </span>
                      )
                    } else if (item.demandSupplyRatio < 0.5 && item.tutorSupplyCount > 0) {
                      badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Ample Supply
                        </span>
                      )
                    }

                    return (
                      <tr key={item.categoryId} className="hover:bg-secondary/20 transition">
                        <td className="py-3 px-4 font-bold text-foreground">
                          <div className="flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-primary shrink-0" />
                            <span>{item.categoryName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground">
                            {item.searchDemandCount} searches
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground">
                            {item.tutorSupplyCount} tutors
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-primary">
                              {item.demandSupplyRatio.toFixed(2)}x
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{badge}</td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {demandSupply.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={demandSupply.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="category demand metrics"
          />
        )}
      </div>
    </div>
  )
}
