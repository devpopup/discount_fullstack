"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown, User, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, logout } = useAuth();

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

  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
    // Redirect to home page after logout
    window.location.href = '/';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '';
    if (user.full_name) {
      const names = user.full_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  return (
    <>
      <nav className="bg-[#F5F8FC] border-b border-[#E8E9EB] relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[86px]">
            {/* Logo and PopReach - Left */}
            <Link href="/" className="flex items-center gap-3 z-50 relative">
              <div className="relative" style={{ width: '150px', height: '25px' }}>
                <Image
                  src="/logo.svg"
                  alt="PopReach Icon"
                  width={24}
                  height={24}
                  className="absolute left-0 top-0"
                  priority
                />
                <span className="absolute left-[28px] top-[2px] text-2xl font-bold text-[#1E3A5F]">
                  PopupReach
                </span>
              </div>
            </Link>

            {/* Center - Browse deals, For Shoppers, For Businesses */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/shoppers"
                className="text-[#343538] font-medium hover:text-[#e94e1b]"
              >
                Browse deals
              </Link>
              <Link
                href="/shoppers"
                className="text-[#343538] font-medium hover:text-[#e94e1b]"
              >
                For Shoppers
              </Link>
              <Link
                href="/business"
                className="text-[#343538] font-medium hover:text-[#e94e1b]"
              >
                For Businesses
              </Link>
            </div>

            {/* Desktop Auth Section - Show Profile or Login/Signup */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                // Profile Avatar with Dropdown
                <DropdownMenu onOpenChange={setProfileDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full bg-[#e94e1b] hover:bg-[#d13f16] text-white p-0"
                    >
                      <span className="text-sm font-semibold">
                        {getUserInitials()}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white border border-gray-200 shadow-lg"
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/shoppers/favorites"
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#1E3A5F] hover:text-white transition-colors cursor-pointer"
                      >
                        <Heart className="h-4 w-4" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/shoppers/claims"
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#1E3A5F] hover:text-white transition-colors cursor-pointer"
                      >
                        <User className="h-4 w-4" />
                        My Claims
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Login/Signup Dropdowns
                <>
                  {/* Login Dropdown */}
                  <DropdownMenu onOpenChange={setLoginDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white rounded-2xl"
                      >
                        Login
                        <ChevronDown
                          className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                            loginDropdownOpen ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-white border border-gray-200 shadow-lg"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          href="/shoppers/auth/signin"
                          className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#1E3A5F] hover:text-white transition-colors cursor-pointer"
                        >
                          as Shopper
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/business/auth/signin"
                          className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#1E3A5F] hover:text-white transition-colors cursor-pointer"
                        >
                          as Business
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Sign Up Dropdown */}
                  <DropdownMenu onOpenChange={setSignupDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-[#1E3A5F] hover:bg-[#FFF] hover:text-[#1E3A5F] text-white rounded-2xl">
                        Sign Up
                        <ChevronDown
                          className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                            signupDropdownOpen ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-white border border-gray-200 shadow-lg"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          href="/shoppers/auth/signup"
                          className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#1E3A5F] hover:text-white transition-colors cursor-pointer"
                        >
                          as Shopper
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/business/auth/signup"
                          className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-[#1E3A5F] hover:text-white transition-colors cursor-pointer"
                        >
                          as Business
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden relative z-[60] p-2 text-[#1E3A5F] hover:bg-gray-200 rounded-md transition-colors"
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
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white text-[#343538] transform transition-transform duration-300 ease-in-out z-[50] md:hidden shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button inside menu */}
        <div className="absolute top-4 right-4">
          <button
            onClick={closeMobileMenu}
            className="p-2 text-[#1E3A5F] hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close mobile menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="pt-20 px-6 overflow-y-auto h-full">
          {/* User Profile Section (if logged in) */}
          {user && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#e94e1b] flex items-center justify-center text-white font-semibold">
                  {getUserInitials()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  href="/shoppers/favorites"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-[#343538] py-2 hover:text-[#e94e1b] transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Favorites
                </Link>
                <Link
                  href="/shoppers/claims"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-[#343538] py-2 hover:text-[#e94e1b] transition-colors"
                >
                  <User className="h-4 w-4" />
                  My Claims
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 py-2 hover:text-red-700 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-6 mb-8">
            <Link
              href="/shoppers"
              onClick={closeMobileMenu}
              className="block text-[#343538] py-3 hover:text-[#e94e1b] transition-colors font-medium text-lg border-b border-gray-200"
            >
              Browse deals
            </Link>
            <Link
              href="/shoppers"
              onClick={closeMobileMenu}
              className="block text-[#343538] py-3 hover:text-[#e94e1b] transition-colors font-medium text-lg border-b border-gray-200"
            >
              For Shoppers
            </Link>
            <Link
              href="/business"
              onClick={closeMobileMenu}
              className="block text-[#343538] py-3 hover:text-[#e94e1b] transition-colors font-medium text-lg border-b border-gray-200"
            >
              For Businesses
            </Link>
          </div>

          {/* Auth Sections - Only show if not logged in */}
          {!user && (
            <div className="space-y-6">
              {/* Login Section */}
              <div>
                <h4 className="text-sm font-semibold text-[#1E3A5F] mb-3">
                  Login
                </h4>
                <div className="space-y-2">
                  <Link
                    href="/shoppers/auth/signin"
                    onClick={closeMobileMenu}
                    className="block text-[#343538] py-2 hover:text-[#e94e1b] transition-colors"
                  >
                    as Shopper
                  </Link>
                  <Link
                    href="/business/auth/signin"
                    onClick={closeMobileMenu}
                    className="block text-[#343538] py-2 hover:text-[#e94e1b] transition-colors"
                  >
                    as Business
                  </Link>
                </div>
              </div>

              {/* Sign Up Section */}
              <div>
                <h4 className="text-sm font-semibold text-[#1E3A5F] mb-3">
                  Sign Up
                </h4>
                <div className="space-y-2">
                  <Link
                    href="/shoppers/auth/signup"
                    onClick={closeMobileMenu}
                    className="block text-[#343538] py-2 hover:text-[#e94e1b] transition-colors"
                  >
                    as Shopper
                  </Link>
                  <Link
                    href="/business/auth/signup"
                    onClick={closeMobileMenu}
                    className="block text-[#343538] py-2 hover:text-[#e94e1b] transition-colors"
                  >
                    as Business
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
