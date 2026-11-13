import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, HasPermission, RequirePermission } from '../context/AuthContext'
import { CURRENT_APP_VERSION } from '../lib/version'
import {
  ShieldCheck,
  LayoutDashboard,
  CheckCircle,
  FolderTree,
  CreditCard,
  Receipt,
  BarChart3,
  Users,
  KeyRound,
  Sliders,
  Activity,
  ArrowLeft,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react'

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('tdms_theme') === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('tdms_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('tdms_theme', 'light')
    }
  }, [darkMode])

  const toggleTheme = () => setDarkMode(!darkMode)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  const navItemClass = (path: string) => `
    flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition
    ${isActive(path)
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }
  `

  return (
    <RequirePermission permission="view:menu:admin_panel" redirectTo="/">
      <div className="flex h-screen h-dvh w-full overflow-hidden bg-background text-foreground">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 md:static h-screen shrink-0 border-r bg-card flex flex-col transition-all duration-300 ${mobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'
            } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
        >
          {/* Sidebar Header */}
          <div className="h-16 shrink-0 border-b flex items-center justify-between px-4">
            {(!collapsed || mobileOpen) && (
              <div className="flex items-center min-w-0 pr-2">
                <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                <div className="relative ml-2 flex items-center">
                  <span className="font-bold text-base tracking-tight shrink-0">TDMS Control</span>
                  <span
                    className="absolute -top-2 left-full ml-1 px-1.5 py-0.5 text-[8px] font-mono font-bold rounded-full bg-primary/15 text-primary border border-primary/25 leading-none shadow-2xs whitespace-nowrap"
                    title={`Application Version: ${CURRENT_APP_VERSION.raw}`}
                  >
                    v{CURRENT_APP_VERSION.raw}
                  </span>
                </div>
              </div>
            )}
            {collapsed && !mobileOpen && (
              <div className="relative mx-auto flex items-center justify-center" title={`Application Version: ${CURRENT_APP_VERSION.raw}`}>
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[7.5px] font-mono font-bold rounded-full bg-primary text-primary-foreground leading-none shadow-xs">
                  v{CURRENT_APP_VERSION.version.split('.')[0]}
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg border text-muted-foreground hover:bg-secondary hidden md:block"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg border text-muted-foreground hover:bg-secondary md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-6">
            {/* Overview */}
            <div className="space-y-1">
              <Link to="/admin" onClick={() => setMobileOpen(false)} className={navItemClass('/admin')}>
                <LayoutDashboard className="h-5 w-5 shrink-0" />
                {(!collapsed || mobileOpen) && <span>Overview</span>}
              </Link>
            </div>

            {/* Operations Group */}
            <HasPermission permission="view:menu:operations">
              <div className="space-y-1">
                {(!collapsed || mobileOpen) && (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Operations
                  </p>
                )}
                <Link
                  to="/admin/tutor-verifications"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/tutor-verifications')}
                >
                  <CheckCircle className="h-5 w-5 shrink-0 text-amber-500" />
                  {(!collapsed || mobileOpen) && <span>Tutor Verifications</span>}
                </Link>
                <Link
                  to="/admin/categories"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/categories')}
                >
                  <FolderTree className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>Subject Categories</span>}
                </Link>
                <Link
                  to="/admin/subscriptions"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/subscriptions')}
                >
                  <CreditCard className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>Subscription Tiers</span>}
                </Link>
                <Link
                  to="/admin/subscription-payments"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/subscription-payments')}
                >
                  <Receipt className="h-5 w-5 shrink-0 text-emerald-500" />
                  {(!collapsed || mobileOpen) && <span>Payment Verifications</span>}
                </Link>
              </div>
            </HasPermission>

            {/* Analytics Group */}
            <HasPermission permission="view:menu:analytics">
              <div className="space-y-1">
                {(!collapsed || mobileOpen) && (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Analytics & Reports
                  </p>
                )}
                <Link
                  to="/admin/reports"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/reports')}
                >
                  <BarChart3 className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>Activity & Demand</span>}
                </Link>
              </div>
            </HasPermission>

            {/* Administration Group */}
            <HasPermission permission="view:menu:administration">
              <div className="space-y-1">
                {(!collapsed || mobileOpen) && (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    System Administration
                  </p>
                )}
                <Link
                  to="/admin/users"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/users')}
                >
                  <Users className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>User Accounts</span>}
                </Link>
                <Link
                  to="/admin/roles"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/roles')}
                >
                  <KeyRound className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>Role & Claim Matrix</span>}
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/settings')}
                >
                  <Sliders className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>Matching Weights</span>}
                </Link>
                <Link
                  to="/admin/system-health"
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass('/admin/system-health')}>
                  <Activity className="h-5 w-5 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>System & DB Health</span>}
                </Link>
              </div>
            </HasPermission>
          </div>

          {/* Sidebar Footer: Return to Main Site */}
          <div className="p-3 shrink-0 border-t bg-card space-y-1">
            <Link
              to="/"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition group"
            >
              <ArrowLeft className="h-5 w-5 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              {(!collapsed || mobileOpen) && <span>Back to Main Web App</span>}
            </Link>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Admin Header */}
          <header className="h-16 shrink-0 border-b bg-card flex items-center justify-between px-4 sm:px-6 z-10">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-xl border md:hidden text-foreground hover:bg-secondary"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Admin</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-xs sm:text-sm font-semibold capitalize truncate max-w-[150px] sm:max-w-none">
                  {location.pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Quick Return to Main App directly in top header */}
              <Link
                to="/"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border bg-card hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition shadow-2xs"
                title="Exit Admin Panel and Return to Main App"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back to App</span>
              </Link>

              <div className="text-right hidden md:block pl-2 border-l">
                <p className="text-xs font-semibold">{user?.fullName}</p>
                <p className="text-[10px] text-muted-foreground">{user?.roles.join(', ')}</p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl border text-destructive hover:bg-destructive/10 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </header>

          {/* Main Page Container with Admin Content & Footer */}
          <main className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-between">
            <div className="p-4 sm:p-6 lg:p-8 flex-1">
              <Outlet />
            </div>

            {/* Admin Footer: Powered By & Copyright */}
            <footer className="border-t py-3 px-6 bg-card/60 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-2">
                <span>Powered by <span className="font-semibold text-foreground">TDMS Platform</span></span>
                <span>•</span>
                <span className="font-mono text-[11px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground font-medium">v{CURRENT_APP_VERSION.version}</span>
              </div>
              <p className="text-[11px]">© {new Date().getFullYear()} TDMS. All rights reserved.</p>
            </footer>
          </main>
        </div>
      </div>
    </RequirePermission>
  )
}
