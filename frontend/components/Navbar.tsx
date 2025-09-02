"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Optional: Prevent body scroll when mobile menu is open (commented out to avoid black background)
  // useEffect(() => {
  //   if (mobileMenuOpen) {
  //     document.body.style.overflow = "hidden";
  //   } else {
  //     document.body.style.overflow = "";
  //   }

  //   return () => {
  //     document.body.style.overflow = "";
  //   };
  // }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-[#1e3a5f] text-white shadow-lg relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 z-50 relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#e94e1b] to-red-600">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PopupReach</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-[#e94e1b] hover:text-orange-300 transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="/shoppers/auth/signup"
                className="text-white hover:text-[#e94e1b] transition-colors font-medium"
              >
                For Shoppers
              </Link>
              <Link
                href="/business/auth/signup"
                className="text-white hover:text-[#e94e1b] transition-colors font-medium"
              >
                For Business
              </Link>
            </div>

            {/* Desktop Auth Buttons with shadcn Dropdowns */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Sign In Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-[#1e3a5f] bg-transparent"
                  >
                    Sign In
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-white border border-gray-200 shadow-lg"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/shoppers/auth/signin"
                      className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      as Shopper
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/business/auth/signin"
                      className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      as Business
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sign Up Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
                    Sign Up
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-white border border-gray-200 shadow-lg"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/shoppers/auth/signup"
                      className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      as Shopper
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/business/auth/signup"
                      className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      as Business
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden relative z-[60] p-2 text-white hover:bg-[#2a4d6e] rounded-md transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Invisible overlay for clicking outside to close menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[40] md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[#1e3a5f] text-white transform transition-transform duration-300 ease-in-out z-[50] md:hidden shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button inside menu */}
        <div className="absolute top-4 right-4">
          <button
            onClick={closeMobileMenu}
            className="p-2 text-white hover:bg-[#2a4d6e] rounded-md transition-colors"
            aria-label="Close mobile menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="pt-20 px-6 overflow-y-auto h-full">
          {/* Navigation Links */}
          <div className="space-y-6 mb-8">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="block text-[#e94e1b] py-3 hover:text-orange-300 transition-colors font-medium text-lg border-b border-[#2a4d6e]"
            >
              Home
            </Link>
            <Link
              href="/shoppers"
              onClick={closeMobileMenu}
              className="block text-white py-3 hover:text-[#e94e1b] transition-colors font-medium text-lg border-b border-[#2a4d6e]"
            >
              For Shoppers
            </Link>
            <Link
              href="/business/auth/signin"
              onClick={closeMobileMenu}
              className="block text-white py-3 hover:text-[#e94e1b] transition-colors font-medium text-lg border-b border-[#2a4d6e]"
            >
              For Business
            </Link>
          </div>

          {/* Auth Sections */}
          <div className="space-y-6">
            {/* Sign In Section */}
            <div>
              <h4 className="text-sm font-semibold text-blue-200 mb-3">
                Sign In
              </h4>
              <div className="space-y-2">
                <Link
                  href="/shoppers/auth/signin"
                  onClick={closeMobileMenu}
                  className="block text-white py-2 hover:text-[#e94e1b] transition-colors"
                >
                  as Shopper
                </Link>
                <Link
                  href="/business/auth/signin"
                  onClick={closeMobileMenu}
                  className="block text-white py-2 hover:text-[#e94e1b] transition-colors"
                >
                  as Business
                </Link>
              </div>
            </div>

            {/* Sign Up Section */}
            <div>
              <h4 className="text-sm font-semibold text-blue-200 mb-3">
                Sign Up
              </h4>
              <div className="space-y-2">
                <Link
                  href="/shoppers/auth/signup"
                  onClick={closeMobileMenu}
                  className="block text-white py-2 hover:text-[#e94e1b] transition-colors"
                >
                  as Shopper
                </Link>
                <Link
                  href="/business/auth/signup"
                  onClick={closeMobileMenu}
                  className="block text-white py-2 hover:text-[#e94e1b] transition-colors"
                >
                  as Business
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
