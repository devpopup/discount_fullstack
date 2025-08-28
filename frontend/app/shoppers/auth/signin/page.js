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
  Star
} from 'lucide-react'

export default function ShopperSigninComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f] flex">
      {/* Left Side - Desktop Only - Visual Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="w-full flex flex-col justify-center items-center p-12 text-white relative z-10">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img
              src="/logo.svg"
              alt="PopupReach Logo"
              width={120}
              height={120}
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

      {/* Right Side - Coming Soon Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/logo.svg"
                alt="PopupReach Logo"
                width={80}
                height={80}
                className="rounded-lg"
              />
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <ShoppingBag className="w-6 h-6 text-[#e94e1b]"/>
              <h1 className="text-2xl font-bold text-white">Shopper Access</h1>
            </div>
          </div>

          <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-6">
              <div className="hidden lg:flex items-center justify-center space-x-2 mb-4">
                <ShoppingBag className="w-7 h-7 text-[#e94e1b]" />
                <CardTitle className="text-2xl font-bold text-gray-900">Shopper Sign In</CardTitle>
              </div>
              <CardTitle className="lg:hidden text-2xl font-bold text-gray-900">Coming Soon!</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                We're working hard to bring you the best shopping experience
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-8">
              {/* Coming Soon Message */}
              <div className="text-center py-8">
                <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-[#e94e1b] to-red-600 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Shopper Features Coming Soon!
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  We're building an amazing experience for shoppers to discover and claim exclusive local deals. 
                  Get ready to save big on your favorite products and services!
                </p>

                {/* Feature Preview */}
                <div className="grid grid-cols-1 gap-4 text-left bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#e94e1b] rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">Location-based deal discovery</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#e94e1b] rounded-full flex items-center justify-center">
                      <Gift className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">Exclusive discount notifications</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#e94e1b] rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">Favorite businesses tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#e94e1b] rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">Rewards and loyalty points</span>
                  </div>
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
                  <Link href="/business/auth/signin">
                    Are you a business? Sign in here
                  </Link>
                </Button>
              </div>

              <div className="mt-6">
                <p className="text-center text-sm text-gray-500">
                  Want to list your business?{' '}
                  <Link 
                    href="/business/auth/signup" 
                    className="text-[#e94e1b] hover:text-[#d13f16] font-medium"
                  >
                    Create Business Account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-blue-200 text-sm mb-4">Coming soon for shoppers</p>
            <div className="grid grid-cols-1 gap-3 text-xs text-blue-100">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                <span>Discover local deals and offers</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                <span>Get notified about nearby discounts</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-[#e94e1b] rounded-full"></div>
                <span>Save on your favorite local businesses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}