'use client'

import React, { useState } from 'react'
import { ArrowRight, Facebook, Twitter, Instagram, Linkedin, Youtube, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function Footer() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section)
  }

  const linkSections = [
    {
      id: 'solutions',
      title: 'Solutions',
      links: [
        'Local Businesses',
        'Restaurants', 
        'Retail',
        'Custom Campaigns'
      ]
    },
    {
      id: 'company',
      title: 'Company',
      links: [
        'About Us',
        'Careers',
        'Contact'
      ]
    },
    {
      id: 'learn',
      title: 'Learn',
      links: [
        'Blog',
        'Guides',
        'FAQs',
        'Help Center'
      ]
    },
    {
      id: 'legal',
      title: 'Legal',
      links: [
        'Privacy Policy',
        'Terms of Service'
      ]
    }
  ]

  return (
    <footer className="bg-[#1e3a5f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Quick Links Section */}
        <div className="mb-12">
          <h3 className="text-xl lg:text-2xl font-bold text-center mb-8">Quick links</h3>
          
          {/* Desktop Grid Layout */}
          <div className="hidden md:grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {linkSections.map((section) => (
              <div key={section.id}>
                <h4 className="text-lg font-semibold mb-4 text-white">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <a href="#" className="text-blue-200 hover:text-white transition-colors text-sm">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile Accordion Layout */}
          <div className="md:hidden space-y-4">
            {linkSections.map((section) => (
              <div key={section.id} className="border-b border-[#2a4d6e] last:border-b-0">
                <button
                  onClick={() => toggleAccordion(section.id)}
                  className="w-full flex justify-between items-center py-4 text-left focus:outline-none rounded"
                  aria-expanded={openAccordion === section.id}
                  aria-controls={`accordion-${section.id}`}
                >
                  <h4 className="text-lg font-semibold text-white">{section.title}</h4>
                  <ChevronDown 
                    className={`w-5 h-5 text-blue-200 transform transition-transform duration-200 ${
                      openAccordion === section.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                <div
                  id={`accordion-${section.id}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openAccordion === section.id 
                      ? 'max-h-96 opacity-100 pb-4' 
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <ul className="space-y-3 pl-4">
                    {section.links.map((link, index) => (
                      <li key={index}>
                        <a href="#" className="text-blue-200 hover:text-white transition-colors text-sm block py-1">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready to Grow Section */}
        <div className="text-center mb-12">
          <h3 className="text-xl lg:text-2xl font-bold mb-6">Ready to Grow Your Business?</h3>
          <Link href="/business/auth/signin">
            <Button 
              className="bg-[#e94e1b] hover:bg-[#d13f16] text-white px-8 py-3 text-lg font-semibold"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        <Separator className="mb-8 bg-[#2a4d6e]" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Social Media Icons */}
          <div className="flex space-x-4 order-2 md:order-1">
            <a 
              href="#" 
              className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4 text-white" />
            </a>
            <a 
              href="#" 
              className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center hover:bg-blue-600 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4 text-white" />
            </a>
            <a 
              href="#" 
              className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center hover:bg-pink-700 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4 text-white" />
            </a>
            <a 
              href="#" 
              className="w-8 h-8 bg-red-600 rounded flex items-center justify-center hover:bg-red-700 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-4 h-4 text-white" />
            </a>
            <a 
              href="#" 
              className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-900 transition-colors"
              aria-label="X (Twitter)"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          {/* Contact Info and Copyright */}
          <div className="text-center md:text-right order-1 md:order-2 mb-2">
            <div className="text-sm text-blue-200 mb-2">
              Email: info@popupreach.com
            </div>
            <div className="text-sm text-blue-200 mb-4">
              Phone: (555) 555-7500
            </div>
            <div className="text-xs text-blue-300">
              © 2025 PopupReach. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
