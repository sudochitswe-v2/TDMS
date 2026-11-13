import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, HasPermission } from '../context/AuthContext'
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
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-primary shrink-0">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="tracking-tight">TDMS</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium hidden sm:inline-block">
              Discovery & Matching
            </span>
          </Link>

          {/* Desktop Nav Links (Home button removed) */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-6 text-sm font-medium">
            <Link
              to="/tutors"
              className={`flex items-center space-x-1 transition hover:text-primary ${isActive('/tutors') ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
            >
              <Search className="h-4 w-4" />
              <span>Find Tutors</span>
            </Link>

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

          {/* Right Header Actions: Admin, Auth/Profile, and Theme Switch at Far Right Corner */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Admin Panel Switcher */}
            {hasPermission('view:menu:admin_panel') && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border transition"
              >
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Admin Panel</span>
              </Link>
            )}

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-medium leading-none">{user.fullName}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {user.roles.join(', ')}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg border text-destructive hover:bg-destructive/10 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
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
            <Link
              to="/tutors"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium"
            >
              Find Tutors
            </Link>
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
      <footer className="border-t py-6 bg-secondary/30 text-xs text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">TDMS Platform</span>
            <span>— Student-Tutor Discovery and Matching System</span>
          </div>
          <div>.NET 10 + MariaDB + React SPA with PBAC Authorization</div>
        </div>
      </footer>
    </div>
  )
}
