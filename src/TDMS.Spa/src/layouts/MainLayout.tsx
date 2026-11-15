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
  Sparkles,
  Home,
  UserCheck,
  ChevronRight
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

  // Prevent background body scroll when mobile slide drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

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
        setMobileMenuOpen(false)
      }
    }

    if (profileDropdownOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileDropdownOpen, mobileMenuOpen])

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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isTutor = user?.roles?.includes('Tutor')
  const isLearner = user?.roles?.includes('Learner') || user?.roles?.includes('ParentStudent') || !!user?.accountSubType
  const isAdmin = user?.roles?.includes('SystemAdmin') || user?.roles?.includes('OperationAdmin') || hasPermission('view:menu:admin_panel')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 gap-4">
          {/* Brand */}
          <Link to="/" className="inline-flex items-center font-bold text-xl text-primary shrink-0 group mr-4">
            <GraduationCap className="h-7 w-7 text-primary shrink-0 transition-transform group-hover:scale-105" />
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

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-6 text-sm font-medium">
            <HasPermission permission="view:menu:find_tutors">
              <Link
                to="/tutors"
                className={`flex items-center space-x-1.5 transition hover:text-primary ${isActive('/tutors') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <Search className="h-4 w-4" />
                <span>Find Tutors</span>
              </Link>
            </HasPermission>

            {/* Gated Top-Nav Items */}
            <HasPermission permission="view:menu:learner_account">
              <Link
                to="/account"
                className={`flex items-center space-x-1.5 transition hover:text-primary ${isActive('/account') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <BookOpen className="h-4 w-4" />
                <span>My Requirements</span>
              </Link>
            </HasPermission>

            <HasPermission permission="view:menu:tutor_workspace">
              <Link
                to="/tutor-studio"
                className={`flex items-center space-x-1.5 transition hover:text-primary ${isActive('/tutor-studio') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Tutor Studio</span>
              </Link>
            </HasPermission>

            <HasPermission permission="view:menu:messaging">
              <Link
                to="/messages"
                className={`flex items-center space-x-1.5 transition hover:text-primary ${isActive('/messages') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Inbox</span>
              </Link>
            </HasPermission>

            <HasPermission permission="view:menu:feedback">
              <Link
                to="/reviews"
                className={`flex items-center space-x-1.5 transition hover:text-primary ${isActive('/reviews') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
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
                  className={`flex items-center justify-center h-9 w-9 rounded-full border transition-all ${profileDropdownOpen
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

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile navigation menu"
              className="md:hidden p-2 rounded-lg border text-foreground hover:bg-secondary transition cursor-pointer active:scale-95"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer with Backdrop (outside header so backdrop-filter does not trap fixed inset-0) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative z-50 w-full max-w-xs sm:max-w-sm h-full bg-card border-l shadow-2xl flex flex-col p-5 overflow-y-auto animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 font-bold text-lg text-primary"
              >
                <GraduationCap className="h-6 w-6" />
                <span className="tracking-tight">TDMS Platform</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-full border leading-none ${getChannelBadgeStyle(
                    appVersion.channel
                  )}`}
                >
                  {appVersion.channel}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation drawer"
                className="p-1.5 rounded-lg border text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Identity Card (If logged in) */}
            {isAuthenticated && user && (
              <div className="my-4 p-3.5 rounded-2xl bg-secondary/30 border space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {user.roles?.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold"
                    >
                      {r}
                    </span>
                  ))}
                  {user.accountSubType && (
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-semibold border">
                      {user.accountSubType}
                    </span>
                  )}
                </div>
                <Link
                  to={getProfilePath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 flex items-center justify-between text-xs font-semibold text-primary pt-1 hover:underline"
                >
                  <span>Manage Workspace Profile</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Primary Navigation Links */}
            <div className="space-y-1 py-2 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                Navigation
              </p>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${location.pathname === '/' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'hover:bg-secondary text-foreground'
                  }`}
              >
                <Home className="h-4.5 w-4.5 shrink-0" />
                <span>Home</span>
              </Link>

              <HasPermission permission="view:menu:find_tutors">
                <Link
                  to="/tutors"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive('/tutors') ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'hover:bg-secondary text-foreground'
                    }`}
                >
                  <Search className="h-4.5 w-4.5 shrink-0" />
                  <span>Find Tutors</span>
                </Link>
              </HasPermission>

              <HasPermission permission="view:menu:learner_account">
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive('/account') ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'hover:bg-secondary text-foreground'
                    }`}
                >
                  <BookOpen className="h-4.5 w-4.5 shrink-0" />
                  <span>My Requirements</span>
                </Link>
              </HasPermission>

              <HasPermission permission="view:menu:tutor_workspace">
                <Link
                  to="/tutor-studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive('/tutor-studio') ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'hover:bg-secondary text-foreground'
                    }`}
                >
                  <GraduationCap className="h-4.5 w-4.5 shrink-0" />
                  <span>Tutor Studio Workspace</span>
                </Link>
              </HasPermission>

              <HasPermission permission="view:menu:messaging">
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive('/messages') ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'hover:bg-secondary text-foreground'
                    }`}
                >
                  <MessageSquare className="h-4.5 w-4.5 shrink-0" />
                  <span>Inbox & Chats</span>
                </Link>
              </HasPermission>

              <HasPermission permission="view:menu:feedback">
                <Link
                  to="/reviews"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive('/reviews') ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'hover:bg-secondary text-foreground'
                    }`}
                >
                  <Star className="h-4.5 w-4.5 shrink-0" />
                  <span>Feedback & Reviews</span>
                </Link>
              </HasPermission>

              {hasPermission('view:menu:admin_panel') && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                    Administration
                  </p>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-blue-600 dark:text-blue-400 ${isActive('/admin') ? 'bg-blue-500/15 font-semibold' : 'hover:bg-secondary'
                      }`}
                  >
                    <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                    <span>Admin Control Panel</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t space-y-3">
              {/* Theme Selector */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border bg-secondary/30 hover:bg-secondary text-xs font-semibold transition"
              >
                <span className="flex items-center space-x-2">
                  {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-foreground" />}
                  <span>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </span>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  {darkMode ? 'DARK' : 'LIGHT'}
                </span>
              </button>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl border border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/20 text-xs font-bold transition shadow-2xs"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out of Session</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition shadow-xs"
                  >
                    Sign In
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/register/learner"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2 rounded-xl border text-center text-[11px] font-medium hover:bg-secondary transition"
                    >
                      Join as Student
                    </Link>
                    <Link
                      to="/register/tutor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2 rounded-xl border text-center text-[11px] font-medium hover:bg-secondary transition"
                    >
                      Become a Tutor
                    </Link>
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
                <p className="text-[10px] text-muted-foreground">
                  TDMS v{appVersion.raw} &bull; {appVersion.channel} channel
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - with bottom padding on mobile to clear bottom tab bar */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* App Mobile Bottom Navigation Bar (Persistent 1-Thumb Reachability) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-lg md:hidden"
      >
        <div className="flex items-center justify-around h-16 px-1 safe-area-pb">
          {isTutor ? (
            <>
              {/* Tutor Mobile Bottom Tabs */}
              <Link
                to="/tutor-studio"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/tutor-studio') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/tutor-studio') ? 'bg-primary/10' : ''}`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="truncate">Studio</span>
              </Link>

              <Link
                to="/tutors"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/tutors') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/tutors') ? 'bg-primary/10' : ''}`}>
                  <Search className="h-5 w-5" />
                </div>
                <span className="truncate">Tutors</span>
              </Link>

              <Link
                to="/messages"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/messages') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/messages') ? 'bg-primary/10' : ''}`}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="truncate">Inbox</span>
              </Link>

              <Link
                to="/reviews"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/reviews') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/reviews') ? 'bg-primary/10' : ''}`}>
                  <Star className="h-5 w-5" />
                </div>
                <span className="truncate">Feedback</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <div className="p-1 rounded-xl">
                  <Menu className="h-5 w-5" />
                </div>
                <span className="truncate">Menu</span>
              </button>
            </>
          ) : isLearner ? (
            <>
              {/* Student / Learner Mobile Bottom Tabs */}
              <Link
                to="/tutors"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/tutors') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/tutors') ? 'bg-primary/10' : ''}`}>
                  <Search className="h-5 w-5" />
                </div>
                <span className="truncate">Find Tutors</span>
              </Link>

              <Link
                to="/account"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/account') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/account') ? 'bg-primary/10' : ''}`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="truncate">Requirements</span>
              </Link>

              <Link
                to="/messages"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/messages') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/messages') ? 'bg-primary/10' : ''}`}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="truncate">Inbox</span>
              </Link>

              <Link
                to="/reviews"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/reviews') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/reviews') ? 'bg-primary/10' : ''}`}>
                  <Star className="h-5 w-5" />
                </div>
                <span className="truncate">Feedback</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <div className="p-1 rounded-xl">
                  <Menu className="h-5 w-5" />
                </div>
                <span className="truncate">Menu</span>
              </button>
            </>
          ) : isAdmin ? (
            <>
              {/* Admin Mobile Bottom Tabs */}
              <Link
                to="/admin"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/admin') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/admin') ? 'bg-primary/10' : ''}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="truncate">Admin</span>
              </Link>

              <Link
                to="/tutors"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/tutors') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/tutors') ? 'bg-primary/10' : ''}`}>
                  <Search className="h-5 w-5" />
                </div>
                <span className="truncate">Tutors</span>
              </Link>

              <Link
                to="/messages"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/messages') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/messages') ? 'bg-primary/10' : ''}`}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="truncate">Inbox</span>
              </Link>

              <Link
                to="/reviews"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/reviews') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/reviews') ? 'bg-primary/10' : ''}`}>
                  <Star className="h-5 w-5" />
                </div>
                <span className="truncate">Feedback</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <div className="p-1 rounded-xl">
                  <Menu className="h-5 w-5" />
                </div>
                <span className="truncate">Menu</span>
              </button>
            </>
          ) : (
            <>
              {/* Guest / Unauthenticated Mobile Bottom Tabs */}
              <Link
                to="/"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${location.pathname === '/' ? 'bg-primary/10' : ''}`}>
                  <Home className="h-5 w-5" />
                </div>
                <span className="truncate">Home</span>
              </Link>

              <Link
                to="/tutors"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/tutors') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/tutors') ? 'bg-primary/10' : ''}`}>
                  <Search className="h-5 w-5" />
                </div>
                <span className="truncate">Tutors</span>
              </Link>

              <Link
                to="/login"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/login') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/login') ? 'bg-primary/10' : ''}`}>
                  <User className="h-5 w-5" />
                </div>
                <span className="truncate">Login</span>
              </Link>

              <Link
                to="/register/learner"
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition active:scale-95 ${isActive('/register') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive('/register') ? 'bg-primary/10' : ''}`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="truncate">Register</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <div className="p-1 rounded-xl">
                  <Menu className="h-5 w-5" />
                </div>
                <span className="truncate">Menu</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t py-8 bg-secondary/30 text-xs text-muted-foreground mt-auto mb-16 md:mb-0">
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
