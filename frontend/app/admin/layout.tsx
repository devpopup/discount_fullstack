'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isAdminAuthenticated, getAdminUser, adminLogout } from '@/lib/admin-api'
import { Shield, Tag, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      return
    }

    // Check if user is authenticated
    if (!isAdminAuthenticated()) {
      router.push('/admin/login')
      return
    }

    setUser(getAdminUser())
  }, [pathname, router])

  // Don't show layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = () => {
    adminLogout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4d6e] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-[#e94e1b] p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-xs text-gray-300">Demo Offer</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/offers')}
                variant="ghost"
                className={`${
                  pathname === '/admin/offers'
                    ? 'bg-white/20 text-white'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Tag className="h-4 w-4 mr-2" />
                Demo Offers
              </Button>

              {/* User Info */}
              <div className="flex items-center space-x-3 pl-4 border-l border-white/20">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-white">{user?.email}</p>
                  <p className="text-xs text-gray-300">Superadmin</p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Button
                onClick={() => {
                  router.push('/admin/offers')
                  setMobileMenuOpen(false)
                }}
                variant="ghost"
                className={`w-full justify-start ${
                  pathname === '/admin/offers'
                    ? 'bg-white/20 text-white'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Tag className="h-4 w-4 mr-2" />
                Demo Offers
              </Button>
              <div className="pt-2 border-t border-white/20">
                <p className="text-sm text-white px-4 py-2">{user?.email}</p>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-white hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
