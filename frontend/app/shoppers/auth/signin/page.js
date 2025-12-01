'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

// Import shadcn components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Icons
import { Mail, Lock, EyeOff, Eye, CheckCircle, ShoppingBag, MapPin, Gift, Star, Loader2 } from 'lucide-react'

export default function ShopperSignin() {
  const router = useRouter()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const registered = urlParams.get('registered')
      const reset = urlParams.get('reset')

      if (registered === 'true') {
        setSuccessMessage('Account created successfully! Please log in.')
      } else if (reset === 'success') {
        setSuccessMessage('Password updated successfully! Please log in with your new password.')
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      
      const result = await signIn({ email, password })
      
      if (result.error) {
        console.error('Login failed:', result.error)
        const errorMessage = typeof result.error === 'object' 
          ? (Array.isArray(result.error) 
              ? result.error.map(err => err.msg || err).join(', ')
              : result.error.message || result.error.detail || JSON.stringify(result.error))
          : result.error
        setError(errorMessage)
        return
      }
      
      if (result.user && result.user.is_business) {
        setError('This account is registered as a business. Please use the business login or register a customer account.')
        return
      }

      login(result.user)
      
      setTimeout(() => {
        router.push('/shoppers')
      }, 100)
      
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to sign in. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f] flex">
      {/* Left Side - Desktop Only - Visual Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="w-full flex flex-col justify-center items-center p-12 text-white relative z-10">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img
              src="/logo.svg"
              alt="PopupReach Logo"
              width={240}
              height={240}
              className="rounded-lg"
            />
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-lg">
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Discover Amazing 
              <span className="text-[#e94e1b]"> Local Deals</span> Near You
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Get notified about exclusive offers from businesses around you. Save money while supporting local shops.
            </p>

            {/* Features */}
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#e94e1b] rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Exclusive Offers</h3>
                  <p className="text-blue-200 text-sm">Access deals only available to app users</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#e94e1b] rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Location-Based</h3>
                  <p className="text-blue-200 text-sm">Find deals from businesses near you</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#e94e1b] rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Save Big</h3>
                  <p className="text-blue-200 text-sm">Up to 50% off on local products and services</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="shopperGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#shopperGrid)" />
          </svg>
        </div>

        {/* Floating Icons */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-[#e94e1b] bg-opacity-20 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-[#e94e1b]" />
        </div>
        <div className="absolute bottom-32 left-16 w-12 h-12 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div className="absolute top-1/3 right-20 w-14 h-14 bg-[#e94e1b] bg-opacity-15 rounded-full flex items-center justify-center">
          <Star className="w-7 h-7 text-[#e94e1b]" />
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/logo.svg"
                alt="PopupReach Logo"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <ShoppingBag className="w-6 h-6 text-[#e94e1b]"/>
              <h1 className="text-2xl font-bold text-white">Shopper Sign In</h1>
            </div>
          </div>

          <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-6">
              <div className="hidden lg:flex items-center justify-center space-x-2 mb-4">
                <ShoppingBag className="w-7 h-7 text-[#e94e1b]" />
                <CardTitle className="text-2xl font-bold text-gray-900">Shopper Sign In</CardTitle>
              </div>
              <CardTitle className="lg:hidden text-2xl font-bold text-gray-900">Welcome back</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Access your account and discover amazing deals
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-8">
              {successMessage && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-12 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <Link 
                    href="/shoppers/auth/forgot-password" 
                    className="text-sm text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white h-12 text-lg font-semibold disabled:opacity-50 rounded-lg shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Don't have an account?</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
                asChild
              >
                <Link href="/shoppers/auth/signup">
                  Create Shopper Account
                </Link>
              </Button>

              <div className="mt-6">
                <p className="text-center text-sm text-gray-500">
                  Are you a business owner?{' '}
                  <Link 
                    href="/business/auth/signin" 
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Sign in as Business
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-blue-200 text-sm mb-4">Discover local deals near you</p>
            <div className="grid grid-cols-1 gap-3 text-xs text-blue-100">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                <span>Get exclusive offers from nearby businesses</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                <span>Save money on your favorite products</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                <span>Support local businesses in your community</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}