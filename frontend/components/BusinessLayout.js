// components/BusinessLayout.js
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiRequest, endpoints } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { 
  BarChart3,
  Tag, 
  ShoppingBag,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  RefreshCw,
  User,
  Menu,
  X
} from 'lucide-react'

// Sidebar Navigation Component
function Sidebar({ activeTab, setActiveTab, onLogout, userInfo, isOpen, onClose }) {
  const router = useRouter()
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/business/dashboard' },
    { id: 'offers', label: 'Offers', icon: Tag, path: '/business/offers' },
    { id: 'products', label: 'Products', icon: ShoppingBag, path: '/business/products' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/business/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/business/settings' },
  ]

  const handleNavigation = (item) => {
    if (setActiveTab) {
      setActiveTab(item.id)
    } else {
      router.push(item.path)
    }
    // Close mobile menu after navigation
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay - Invisible for click-to-close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-slate-800 text-white h-screen fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out border-r border-slate-700
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close Button (Mobile) */}
        <div className="lg:hidden absolute top-4 right-4 z-50">
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-slate-700 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 lg:p-6 border-b border-slate-700">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
          </div>
          <span className="text-lg lg:text-xl font-semibold">PopupReach</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === item.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-700 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-white truncate">
                {userInfo?.business?.business_name || userInfo?.business_name || `${userInfo?.first_name}'s Business` || 'Business Account'}
              </h2>
              <p className="text-xs text-slate-400">Business Portal</p>
            </div>
          </div>
          
          {/* Logout Button */}
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full text-slate-400 hover:bg-slate-700 hover:text-white justify-start"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </>
  )
}

// Top Header Component
function TopHeader({ title, subtitle, onRefresh, refreshing, showRefresh = false, children, onMenuToggle }) {
  return (
    <div className="bg-slate-900 border-b border-slate-700 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-lg lg:text-3xl font-bold text-white truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs lg:text-sm text-slate-400 mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {showRefresh && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="hidden sm:flex items-center space-x-2 border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Refresh</span>
            </Button>
          )}
          
          {children}
          
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Layout Component
export default function BusinessLayout({ 
  children, 
  activeTab,
  setActiveTab,
  title = "Dashboard",
  subtitle,
  onRefresh,
  refreshing = false,
  showRefresh = false,
  headerActions
}) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [businessProfile, setBusinessProfile] = useState(null)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  // Fetch business profile data
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      if (user && user.is_business) {
        try {
          const result = await apiRequest(endpoints.businessProfile, {
            method: 'GET'
          })
          if (result.success && result.data) {
            setBusinessProfile(result.data)
          }
        } catch (error) {
          // Silently handle error - user data fallback will be used
        }
      }
    }

    fetchBusinessProfile()
  }, [user])

  // Close sidebar on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Redirect if not business user
  if (!user || !user.is_business) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Business account required to access this page.</p>
          <Button 
            onClick={() => router.push('/business/auth/signin')} 
            className="bg-[#e94e1b] hover:bg-[#d13f16]"
          >
            Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userInfo={{...user, ...businessProfile}}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <TopHeader 
          title={title}
          subtitle={subtitle}
          onRefresh={onRefresh}
          refreshing={refreshing}
          showRefresh={showRefresh}
          onMenuToggle={toggleSidebar}
        >
          {headerActions}
        </TopHeader>
        
        <main className="flex-1 p-4 lg:p-6 overflow-x-auto bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  )
}