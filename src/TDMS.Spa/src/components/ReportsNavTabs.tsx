import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, CreditCard, Crown } from 'lucide-react'

export const ReportsNavTabs: React.FC = () => {
  const location = useLocation()

  const tabs = [
    {
      name: 'Activity & Demand',
      path: '/admin/reports',
      icon: BarChart3,
      description: 'Subject category ratios & search demand',
    },
    {
      name: 'Payment Reports',
      path: '/admin/reports/payments',
      icon: CreditCard,
      description: 'Revenue, payment channels & financial audit',
    },
    {
      name: 'Subscription Reports',
      path: '/admin/reports/subscriptions',
      icon: Crown,
      description: 'Tier adoption, active licenses & renewals',
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-3 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = location.pathname === tab.path

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
            <span>{tab.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
