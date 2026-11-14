import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, HasPermission } from '../context/AuthContext'
import { useAppVersion, getChannelBadgeStyle } from '../lib/version'
import {
  GraduationCap,
  MessageSquare,
  Star,
  Settings,
  ShieldCheck,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  BookOpen,
  Search,
} from 'lucide-react'

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout, hasPermission } = useAuth()
  const appVersion = useAppVersion()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('tdms_theme') === 'dark'
  })

  // Close menus on route change
  useEffect(() => {
    setProfileDropdownOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Handle click outside and Escape key to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileDropdownOpen])

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
    navigate('/')
  }

  // Resolve respective profile editing path depending on active user role
  const getProfilePath = () => {
    if (!user) return '/login'
    if (user.roles?.includes('Tutor')) return '/tutor-studio'
    if (user.roles?.includes('Learner') || user.roles?.includes('ParentStudent') || user.accountSubType) {
      return '/account'
    }
    if (user.roles?.includes('SystemAdmin') || user.roles?.includes('OperationAdmin')) {
      return '/admin'
    }
    return '/account'
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 gap-4">
          {/* Brand */}
          <Link to="/" className="inline-flex items-center font-bold text-xl text-primary shrink-0 group mr-4">
            <GraduationCap className="h-7 w-7 text-primary shrink-0" />
            <div className="relative ml-2 flex items-center">
              <span className="tracking-tight text-xl font-bold">TDMS</span>
              <span
                className={`absolute -top-1.5 left-full ml-1 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider rounded-full border leading-none shadow-2xs whitespace-nowrap ${getChannelBadgeStyle(
                  appVersion.channel
                )}`}
                title={`Release Channel: ${appVersion.channel}`}
              >
                {appVersion.channel}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Home button removed) */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-6 text-sm font-medium">
            <HasPermission permission="view:menu:find_tutors">
              <Link
                to="/tutors"
                className={`flex items-center space-x-1 transition hover:text-primary ${isActive('/tutors') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <Search className="h-4 w-4" />
                <span>Find Tutors</span>
              </Link>
            </HasPermission>

            {/* Gated Top-Nav Items */}
            <HasPermission permission="view:menu:learner_account">
              <Link
                to="/account"
                className={`flex items-center space-x-1 transition hover:text-primary ${isActive('/account') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <BookOpen className="h-4 w-4" />
                <span>My Requirements</span>
              </Link>
            </HasPermission>

            <HasPermission permission="view:menu:tutor_workspace">
              <Link
                to="/tutor-studio"
                className={`flex items-center space-x-1 transition hover:text-primary ${isActive('/tutor-studio') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Tutor Studio</span>
              </Link>
            </HasPermission>

            <HasPermission permission="view:menu:messaging">
              <Link
                to="/messages"
                className={`flex items-center space-x-1 transition hover:text-primary ${isActive('/messages') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Inbox</span>
              </Link>
            </HasPermission>

            <HasPermission permission="view:menu:feedback">
              <Link
                to="/reviews"
                className={`flex items-center space-x-1 transition hover:text-primary ${isActive('/reviews') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <Star className="h-4 w-4" />
                <span>Feedback</span>
              </Link>
            </HasPermission>
          </nav>

          {/* Right Header Actions: Profile Dropdown & Theme Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Authenticated State: Profile Icon with Dropdown Menu */}
            {isAuthenticated && user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-label="User profile menu"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  title={user.fullName || 'User Profile'}
                  className={`flex items-center justify-center h-9 w-9 rounded-full border transition-all ${
                    profileDropdownOpen
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/15 text-primary'
                      : 'border-border bg-secondary/60 text-foreground hover:bg-secondary hover:border-primary/40'
                  }`}
                >
                  <User className="h-4.5 w-4.5 text-primary" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl border bg-card p-2 shadow-xl z-50 text-foreground animate-in fade-in-50 zoom-in-95 duration-150"
                  >
                    {/* User Summary Info */}
                    <div className="px-3 py-2.5 border-b mb-1">
                      <p className="text-xs font-bold text-foreground truncate">{user.fullName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {user.roles?.map((r) => (
                          <span
                            key={r}
                            className="px-1.5 py-0.2 rounded-md bg-primary/10 text-primary text-[10px] font-bold"
                          >
                            {r}
                          </span>
                        ))}
                        {user.accountSubType && (
                          <span className="px-1.5 py-0.2 rounded-md bg-secondary text-secondary-foreground text-[10px] font-semibold">
                            {user.accountSubType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Profile Button (Redirects to respective profile editing page) */}
                    <Link
                      to={getProfilePath()}
                      role="menuitem"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-semibold rounded-xl hover:bg-secondary transition text-foreground group"
                    >
                      <User className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col text-left">
                        <span>Profile</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {user.roles?.includes('Tutor')
                            ? 'Edit Tutor Profile'
                            : user.roles?.includes('SystemAdmin') || user.roles?.includes('OperationAdmin')
                            ? 'Admin System Management'
                            : 'Edit Learner Profile'}
                        </span>
                      </div>
                    </Link>

                    {/* Admin Panel Direct Link (if user has admin permission) */}
                    {hasPermission('view:menu:admin_panel') && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-semibold rounded-xl hover:bg-secondary transition text-foreground group"
                      >
                        <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col text-left">
                          <span>Admin Panel</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Operational governance
                          </span>
                        </div>
                      </Link>
                    )}

                    <div className="border-t my-1" />

                    {/* Logout Dropdown Button */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition text-left group"
                    >
                      <LogOut className="h-4 w-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium hover:text-primary transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register/learner"
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition shadow-xs"
                >
                  Join as Learner
                </Link>
              </div>
            )}

            {/* Theme Toggle (At Far Right Corner) */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg border text-muted-foreground hover:bg-secondary hover:text-foreground transition"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b bg-background px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium"
            >
              Home
            </Link>
            <HasPermission permission="view:menu:find_tutors">
              <Link
                to="/tutors"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm font-medium"
              >
                Find Tutors
              </Link>
            </HasPermission>
            <HasPermission permission="view:menu:learner_account">
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm font-medium"
              >
                My Requirements
              </Link>
            </HasPermission>
            <HasPermission permission="view:menu:tutor_workspace">
              <Link
                to="/tutor-studio"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm font-medium"
              >
                Tutor Studio
              </Link>
            </HasPermission>
            <HasPermission permission="view:menu:messaging">
              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm font-medium"
              >
                Inbox
              </Link>
            </HasPermission>
            <HasPermission permission="view:menu:feedback">
              <Link
                to="/reviews"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm font-medium"
              >
                Feedback
              </Link>
            </HasPermission>
            {hasPermission('view:menu:admin_panel') && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400"
              >
                Go to Admin Panel
              </Link>
            )}

            {isAuthenticated && user && (
              <div className="pt-2 border-t space-y-1">
                <div className="px-1 py-1">
                  <p className="text-xs font-bold text-foreground">{user.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">{user.email}</p>
                </div>
                <Link
                  to={getProfilePath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 py-1.5 text-sm font-medium hover:text-primary transition"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span>Profile</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center space-x-2 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="pt-2 border-t space-y-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-sm font-medium text-primary"
                >
                  Sign In
                </Link>
                <Link
                  to="/register/learner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-sm font-medium text-foreground"
                >
                  Join as Student / Parent
                </Link>
                <Link
                  to="/register/tutor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-sm font-medium text-foreground"
                >
                  Register as Tutor
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-secondary/30 text-xs text-muted-foreground mt-auto">
        <div className="container mx-auto px-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">TDMS Platform</span>
              </div>
              <span>— Tutor-Student Discovery and Matching System</span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full border ${getChannelBadgeStyle(
                  appVersion.channel
                )}`}
              >
                {appVersion.channel}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <Link to="/tutors" className="hover:text-foreground transition">Browse Tutors</Link>
              <Link to="/register/tutor" className="hover:text-foreground transition">Become a Tutor</Link>
              <Link to="/register/learner" className="hover:text-foreground transition">Student Registration</Link>
            </div>
          </div>
          <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-muted-foreground/80">
            <p>© {new Date().getFullYear()} TDMS Platform. All rights reserved.</p>
            <p>Empowering educators and learners across Myanmar</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
