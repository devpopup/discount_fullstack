'use client'

import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Effective Date: October 22, 2025</p>

          <div className="space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Introduction</h2>
              <p className="leading-relaxed">
                PopupReach Inc. ("we," "our," or "us") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services, including our website, mobile applications, AI-powered shopping assistant, and business tools.
              </p>
              <p className="leading-relaxed mt-4">
                By accessing or using PopupReach, you agree to the terms of this Privacy Policy. If you do not agree with our practices, please do not use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-4">1. Personal Information</h3>
              <p className="leading-relaxed mb-3">We may collect personal information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you create an account.</li>
                <li><strong>Business Information:</strong> Business name, address, industry, and other details if you are a business user.</li>
                <li><strong>Payment Information:</strong> Credit card or payment details (processed securely through third-party payment processors).</li>
                <li><strong>Profile Information:</strong> Preferences, interests, and other information you choose to share.</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-6">2. Usage Information</h3>
              <p className="leading-relaxed mb-3">We automatically collect information about how you use our services, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
                <li><strong>Activity Data:</strong> Pages viewed, time spent on pages, links clicked, and other actions taken on our platform.</li>
                <li><strong>Location Data:</strong> GPS or other location-based data if you enable location services.</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-6">3. Cookies and Tracking Technologies</h3>
              <p className="leading-relaxed">
                We use cookies, web beacons, and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings.
              </p>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-6">4. Third-Party Information</h3>
              <p className="leading-relaxed">
                We may receive information about you from third-party sources, such as social media platforms, analytics providers, and marketing partners, to improve our services and provide relevant offers.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">How We Use Your Information</h2>
              <p className="leading-relaxed mb-3">We use the information we collect for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Delivery:</strong> To provide and maintain our services, including processing transactions, delivering personalized content, and managing your account.</li>
                <li><strong>AI Features:</strong> To power our AI shopping assistant and business tools, providing recommendations, insights, and automated support.</li>
                <li><strong>Communication:</strong> To send you updates, promotional offers, newsletters, and important service announcements.</li>
                <li><strong>Analytics:</strong> To analyze usage trends, improve our platform, and develop new features.</li>
                <li><strong>Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems.</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
              </ul>
            </section>

            {/* Sharing Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Sharing Your Information</h2>
              <p className="leading-relaxed mb-3">We may share your information in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>With Business Partners:</strong> To connect shoppers with businesses and facilitate promotions and offers.</li>
                <li><strong>Service Providers:</strong> With third-party vendors who assist us in operating our platform, such as payment processors, hosting providers, and analytics services.</li>
                <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process, or to protect the rights, property, or safety of PopupReach, our users, or others.</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</li>
                <li><strong>With Your Consent:</strong> We may share your information with third parties when you explicitly consent to such sharing.</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Data Security</h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include encryption, secure servers, and regular security audits. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Data Retention</h2>
              <p className="leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. When your information is no longer needed, we will securely delete or anonymize it.
              </p>
            </section>

            {/* Your Privacy Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Your Privacy Rights</h2>
              <p className="leading-relaxed mb-3">Depending on your location, you may have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
                <li><strong>Correction:</strong> Request corrections to inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> Request the deletion of your personal information, subject to legal obligations.</li>
                <li><strong>Objection:</strong> Object to the processing of your information for certain purposes.</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a structured, machine-readable format.</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw your consent to data processing where consent was previously given.</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:info@popupreach.com" className="text-[#e94e1b] hover:underline">info@popupreach.com</a>.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Cookies and Tracking Technologies</h2>
              <p className="leading-relaxed mb-3">
                We use cookies and similar technologies to enhance your experience on our platform. Cookies are small text files stored on your device that help us:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze site traffic and usage patterns</li>
                <li>Deliver personalized content and advertisements</li>
                <li>Improve security and prevent fraud</li>
              </ul>
              <p className="leading-relaxed mt-4">
                You can manage or disable cookies through your browser settings. However, disabling cookies may affect the functionality of our services.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Third-Party Links</h2>
              <p className="leading-relaxed">
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Children's Privacy</h2>
              <p className="leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected information from a child, we will take steps to delete it promptly.
              </p>
            </section>

            {/* Compliance with Canadian Law */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Compliance with Canadian Law</h2>
              <p className="leading-relaxed">
                PopupReach Inc. is headquartered in Winnipeg, Manitoba, Canada, and complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy laws, including Manitoba's privacy legislation. We are committed to protecting your personal information in accordance with Canadian privacy standards.
              </p>
            </section>

            {/* AI and Automated Decision-Making */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">AI and Automated Decision-Making</h2>
              <p className="leading-relaxed">
                Our platform uses artificial intelligence (AI) to provide personalized recommendations, insights, and support. AI algorithms analyze your usage patterns, preferences, and interactions to enhance your experience. You have the right to request information about how AI is used to make decisions that affect you and to challenge such decisions.
              </p>
            </section>

            {/* Changes to This Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Changes to This Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website and updating the effective date. Your continued use of our services after such changes constitutes your acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Contact Us</h2>
              <p className="leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="font-semibold text-[#1E3A5F] mb-2">PopupReach Inc.</p>
                <p>100 Innovation Dr #44</p>
                <p>Winnipeg, MB R3T 6A8</p>
                <p>Canada</p>
                <p className="mt-3">
                  <strong>Email:</strong> <a href="mailto:info@popupreach.com" className="text-[#e94e1b] hover:underline">info@popupreach.com</a>
                </p>
                <p>
                  <strong>Phone:</strong> +1 (431) 445-0998
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="border-t pt-8 mt-8">
              <p className="text-sm text-gray-600 italic">
                By using PopupReach, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
