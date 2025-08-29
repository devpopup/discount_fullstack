"use client";

import React from "react";
import Navbar from "./Navbar";
import HeroBanner from "./HeroBanner";
import Image from "next/image";
import Link from "next/link";
import {
  TrendingUp,
  Zap,
  Target,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "./Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />

      {/* Hero Banner */}
      <HeroBanner />

      {/* How It Works Section */}
      <section className="py-16 lg:py-20 bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              How PopupReach Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center md:text-left">
              <div className="w-16 h-16 bg-[#e94e1b] rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-white">
                Create a Promotion
              </h3>
              <p className="text-blue-200 leading-relaxed">
                Businesses launch a promo in under 2 minutes. Enter your offer,
                set a time, and go live — no tech skills needed.
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="w-16 h-16 bg-[#e94e1b] rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-white">
                Reach Shoppers Nearby
              </h3>
              <p className="text-blue-200 leading-relaxed">
                PopupReach sends it to people walking near your location.
                Customers get a real-time popup based on proximity.
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="w-16 h-16 bg-[#e94e1b] rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-white">
                Track Results & Get More Sales
              </h3>
              <p className="text-blue-200 leading-relaxed">
                See how many viewed, clicked, or visited your store. Turn
                walk-by traffic into loyal customers effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Reach More Customers Section */}
      <section className="py-16 lg:py-20 bg-[#1e3a5f]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Reach More Customers?
          </h2>
          <p className="text-xl text-blue-200 mb-8 lg:mb-12">
            Launch your first promotion or explore deals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link href="/business/auth/signin">
              <Button
                size="lg"
                className="bg-[#e94e1b] hover:bg-[#d13f16] text-white px-8 py-4 text-lg font-semibold w-full sm:w-auto"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Start Promoting
              </Button>
            </Link>
            <Link href="/shoppers">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-blue-400 text-white hover:bg-blue-400 hover:text-[#1e3a5f] bg-transparent px-8 py-4 text-lg font-semibold w-full sm:w-auto"
              >
                <Target className="w-5 h-5 mr-2" />
                Explore Nearby
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* See PopupReach in Action Section */}
      <section className="py-8 sm:py-12 lg:py-20 bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-2">
              See PopupReach in Action
            </h2>
            <p className="text-lg sm:text-xl text-blue-200 max-w-3xl mx-auto px-2">
              Watch how a real-time pop-up deal appears when a customer walks by
              your store - and how you track results instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center justify-items-center mb-8 sm:mb-12">
            {/* Left Column - Map Mockup */}
            <div className="flex justify-center w-full px-2 sm:px-0">
              <div className="max-w-xs sm:max-w-sm w-full">
                <div className="relative h-64 sm:h-80 lg:h-96 w-full">
                  <Image
                    src="/img/map-mockup.svg"
                    alt="PopupReach map view"
                    width={320}
                    height={320}
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Phone Mockup */}
            <div className="flex justify-center w-full px-2 sm:px-0">
              <div className="max-w-xs sm:max-w-sm w-full">
                <div className="relative h-64 sm:h-80 lg:h-96 w-full">
                  <Image
                    src="/img/phone2-mockup.svg"
                    alt="PopupReach phone mockup"
                    width={320}
                    height={320}
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center px-4">
            <Link href="/business/auth/signin">
              <Button
                size="lg"
                className="bg-[#e94e1b] hover:bg-[#d13f16] text-white px-6 sm:px-8 lg:px-12 py-3 sm:py-4 text-base sm:text-lg lg:text-xl font-semibold w-full sm:w-auto max-w-sm sm:max-w-none"
              >
                Launch My First Promotion
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
