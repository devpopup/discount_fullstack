'use client'

import React from 'react'
import { MapPin, Tag, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function Featured() {
  return (
    <section className="w-full bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f] text-white relative overflow-hidden mb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="lg:pr-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Discover Amazing Deals{' '}
              <span className="text-[#e94e1b]">Near You</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed max-w-lg">
              Save money on your favorite products and services. Get instant access to exclusive local deals that pop up when you're nearby.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="bg-[#e94e1b] rounded-full p-2 mt-1">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Location-Based</h3>
                  <p className="text-sm text-blue-100">Deals appear when you're nearby</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-[#e94e1b] rounded-full p-2 mt-1">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Exclusive Offers</h3>
                  <p className="text-sm text-blue-100">Special discounts just for you</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-[#e94e1b] rounded-full p-2 mt-1">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real-Time</h3>
                  <p className="text-sm text-blue-100">Fresh deals updated daily</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup */}
          <div className="relative lg:pl-8">
            <div className="relative h-96 w-full">
              <Image
                src="/img/phone-mockup.svg"
                alt="PopupReach Shoppers"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}