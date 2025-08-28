'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  MapPin,
  ArrowLeft,
  Clock,
  Users,
  ShoppingBag,
  Gift,
  Star,
  Smartphone,
  Bell
} from 'lucide-react'

export default function ShopperSignupComingSoon() {
  return (
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

      {/* Right Side - Coming Soon Content */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-2xl">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 mb-4 text-white hover:text-[#e94e1b] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

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
              {/* Coming Soon Message */}
              <div className="text-center py-8">
                <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-[#e94e1b] to-red-600 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Shopper Registration Coming Soon!
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  We're crafting the perfect experience for deal hunters like you. Get ready to discover, save, and enjoy exclusive offers from your favorite local businesses!
                </p>

                {/* Feature Preview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left bg-gray-50 p-6 rounded-lg mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#e94e1b] rounded-full flex items-center justify-center mt-1">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Location-Based Discovery</h4>
                      <p className="text-xs text-gray-600">Find deals from businesses near you automatically</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#e94e1b] rounded-full flex items-center justify-center mt-1">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Smart Notifications</h4>
                      <p className="text-xs text-gray-600">Get alerts for deals you actually care about</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#e94e1b] rounded-full flex items-center justify-center mt-1">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Favorite Businesses</h4>
                      <p className="text-xs text-gray-600">Follow your preferred shops for exclusive offers</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#e94e1b] rounded-full flex items-center justify-center mt-1">
                      <Gift className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Rewards Program</h4>
                      <p className="text-xs text-gray-600">Earn points and unlock special perks</p>
                    </div>
                  </div>
                </div>

                {/* Preview Badge */}
                <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile app coming soon too!</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
                  asChild
                >
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>

                <Button 
                  className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white h-12 text-lg font-semibold rounded-lg shadow-lg"
                  asChild
                >
                  <Link href="/business/auth/signup">
                    Own a business? Join as Business Owner
                  </Link>
                </Button>
              </div>

              {/* Terms and Privacy */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  When available, by creating an account you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>

              {/* Business Link */}
              <div className="mt-4">
                <p className="text-center text-sm text-gray-500">
                  Want to promote your business?{" "}
                  <Link
                    href="/business/auth/signin"
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Business Sign In
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
  )
}