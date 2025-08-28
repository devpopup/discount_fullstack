'use client'

import React from 'react'
import { Search, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export default function HeroBanner() {
  return (
    <section className="bg-gradient-to-br from-[#1e3a5f] via-[#2a4d6e] to-[#1e3a5f] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="lg:pr-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Launch Local Promos That{' '}
              <span className="text-[#e94e1b]">Pop Up</span> at the Right Time
            </h1>
            
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed max-w-lg">
              PopupReach helps local businesses deliver real-time promotions to nearby customers and gives shoppers instant access to deals they care about.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/shoppers">
                <Button 
                  size="lg" 
                  className="bg-[#e94e1b] hover:bg-[#d13f16] text-white px-8 py-4 text-lg font-semibold w-full"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Explore Deals Nearby
                </Button>
              </Link>
              <Link href="/business/auth/signin">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-[#1e3a5f] text-white hover:bg-[#617180] bg-transparent px-8 py-4 text-lg font-semibold w-full"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Promote My Business
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative lg:pl-8">
            <div>
              <div className="relative h-96 w-full">
                <Image
                  src="/img/phone-mockup.svg"
                  alt="PopupReach"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}