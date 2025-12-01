'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

// Import shadcn components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'

// Icons
import { Mail, Lock, EyeOff, Eye, User, ShoppingBag, Gift, Bell, Smartphone, Loader2 } from 'lucide-react'

export default function ShopperSignup() {
  const router = useRouter()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setIsLoading(false)
      return
    }

    try {
      
      const signupData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        is_business: false
      }

      const result = await signUp(signupData)
      
      if (result.error) {
        console.error('Signup failed:', result.error)
        const errorMessage = typeof result.error === 'object' 
          ? (Array.isArray(result.error) 
              ? result.error.map(err => err.msg || err).join(', ')
              : result.error.message || result.error.detail || JSON.stringify(result.error))
          : result.error
        setError(errorMessage)
        return
      }

      login(result.user)
      
      setTimeout(() => {
        router.push('/shoppers')
      }, 100)
      
    } catch (err) {
      console.error('Signup error:', err)
      setError('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f] flex">
      {/* Left Side - Desktop Only - Visual Content */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
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
          <div className="text-center max-w-lg mb-8">
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Join Thousands of 
              <span className="text-[#e94e1b]"> Smart Shoppers</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Be the first to know about amazing deals from local businesses. Save money, discover new places, and support your community.
            </p>
          </div>

          {/* Success Stats */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-[#e94e1b] mb-1">50%</div>
              <div className="text-sm text-blue-600">Average savings</div>
            </div>
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-[#e94e1b] mb-1">100+</div>
              <div className="text-sm text-blue-600">Local businesses</div>
            </div>
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-[#e94e1b] mb-1">24/7</div>
              <div className="text-sm text-blue-600">Deal notifications</div>
            </div>    
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-[#e94e1b] mb-1">Free</div>
              <div className="text-sm text-blue-600">Always free to use</div>
            </div>
          </div>
        </div>

        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="shopperGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="1"/>
                <circle cx="40" cy="40" r="2" fill="white" fillOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#shopperGrid)" />
          </svg>
        </div>

        {/* Floating Icons */}
        <div className="absolute top-16 left-16 w-16 h-16 bg-[#e94e1b] bg-opacity-20 rounded-full flex items-center justify-center">
          <Gift className="w-8 h-8 text-[#e94e1b]" />
        </div>
        <div className="absolute bottom-20 left-12 w-12 h-12 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div className="absolute top-1/4 right-16 w-14 h-14 bg-[#e94e1b] bg-opacity-15 rounded-full flex items-center justify-center">
          <Smartphone className="w-7 h-7 text-[#e94e1b]" />
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-2xl">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/logo.svg"
                alt="PopupReach Logo"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
          </div>

          <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-4">
              <div className="hidden lg:flex items-center justify-center space-x-2 mb-4">
                <ShoppingBag className="w-7 h-7 text-[#e94e1b]" />
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Join as Shopper
                </CardTitle>
              </div>
              <CardTitle className="lg:hidden text-2xl font-bold text-gray-900">
                Join PopupReach
              </CardTitle>

              <CardDescription className="text-gray-600 text-base">
                Already have an account?{" "}
                <Link
                  href="/shoppers/auth/signin"
                  className="text-[#e94e1b] font-semibold hover:text-[#d13f16] hover:underline"
                >
                  Sign in
                </Link>
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 mb-6">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700 font-semibold">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Your first name"
                        className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700 font-semibold">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Your last name"
                        className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Email Field */}
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
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className="pl-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create password"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        className="pl-10 pr-12 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={setAcceptTerms}
                    className="mt-1"
                  />
                  <Label htmlFor="acceptTerms" className="text-sm text-gray-600 leading-relaxed">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit"
                  disabled={isLoading || !acceptTerms}
                  className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white h-12 text-lg font-semibold disabled:opacity-50 rounded-lg shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    'Create Shopper Account'
                  )}
                </Button>
              </form>

              {/* Feature Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3">What you'll get:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                    <span className="text-gray-600">Exclusive local deals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                    <span className="text-gray-600">Smart notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                    <span className="text-gray-600">Favorite businesses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                    <span className="text-gray-600">Rewards program</span>
                  </div>
                </div>
              </div>

              {/* Business Link */}
              <div className="mt-4">
                <p className="text-center text-sm text-gray-500">
                  Want to promote your business?{" "}
                  <Link
                    href="/business/auth/signup"
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Join as Business Owner
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Features */}
          <div className="lg:hidden mt-6 text-center">
            <p className="text-blue-200 text-sm mb-4">
              Join the future of local shopping
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-blue-100">
              <div className="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-lg font-bold text-[#e94e1b] mb-1">
                  50%
                </div>
                <div>Avg savings</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-lg font-bold text-[#e94e1b] mb-1">Free</div>
                <div>Always free</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}