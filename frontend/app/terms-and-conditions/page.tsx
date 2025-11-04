'use client'

import React from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">Terms and Conditions</h1>
          <p className="text-gray-600 mb-8">Effective Date: October 22, 2025</p>

          <div className="space-y-8 text-gray-700">
            {/* Agreement to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Agreement to Terms</h2>
              <p className="leading-relaxed">
                Welcome to PopupReach Inc. ("PopupReach," "we," "our," or "us"). By accessing or using our platform, website, mobile applications, and services (collectively, the "Services"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use our Services.
              </p>
              <p className="leading-relaxed mt-4">
                These Terms constitute a legally binding agreement between you and PopupReach Inc., a company incorporated in Manitoba, Canada. Please read them carefully before using our Services.
              </p>
            </section>

            {/* Use License */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Use License</h2>
              <p className="leading-relaxed mb-3">
                PopupReach grants you a limited, non-exclusive, non-transferable, and revocable license to access and use our Services for personal or business purposes, subject to these Terms. You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Services for any unlawful purpose or in violation of these Terms.</li>
                <li>Modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information, software, products, or services obtained from the Services.</li>
                <li>Reverse engineer, decompile, or disassemble any portion of the Services.</li>
                <li>Remove, alter, or obscure any proprietary notices on the Services.</li>
                <li>Access or use the Services to build a competing product or service.</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">User Accounts</h2>
              <p className="leading-relaxed mb-3">
                To access certain features of the Services, you may need to create an account. When creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information.</li>
                <li>Maintain and update your information to keep it accurate and current.</li>
                <li>Maintain the security and confidentiality of your account credentials.</li>
                <li>Accept responsibility for all activities that occur under your account.</li>
                <li>Notify us immediately of any unauthorized use of your account.</li>
              </ul>
              <p className="leading-relaxed mt-4">
                We reserve the right to suspend or terminate your account if any information provided is inaccurate, false, or violates these Terms.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Acceptable Use</h2>
              <p className="leading-relaxed mb-3">
                You agree to use the Services in a manner consistent with all applicable laws and regulations. You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Engage in any activity that disrupts or interferes with the Services or servers and networks connected to the Services.</li>
                <li>Use the Services to transmit any harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable content.</li>
                <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity.</li>
                <li>Collect or harvest any personally identifiable information from the Services without consent.</li>
                <li>Use automated systems (e.g., bots, scrapers) to access the Services without our prior written permission.</li>
                <li>Engage in any fraudulent activity or attempt to manipulate or abuse our promotional offers or features.</li>
              </ul>
            </section>

            {/* Service Features */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Service Features</h2>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-4">1. Mobile Pop-Up Notifications</h3>
              <p className="leading-relaxed">
                PopupReach provides a platform for businesses to send mobile pop-up notifications to shoppers about promotions, discounts, and offers. By using the Services, shoppers consent to receiving such notifications based on their preferences and location settings.
              </p>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-6">2. AI Shopping Assistant</h3>
              <p className="leading-relaxed">
                Our AI-powered shopping assistant helps shoppers discover deals, compare prices, and make informed purchasing decisions. The assistant uses machine learning algorithms to provide personalized recommendations based on your preferences and browsing behavior.
              </p>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-6">3. AI Business Assistant</h3>
              <p className="leading-relaxed">
                Businesses can use our AI business assistant to create and manage promotional campaigns, analyze customer data, and optimize marketing strategies. The assistant provides insights and recommendations to help businesses maximize the effectiveness of their promotions.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Intellectual Property</h2>
              <p className="leading-relaxed mb-3">
                All content, features, and functionality of the Services, including but not limited to text, graphics, logos, images, software, and AI algorithms, are the exclusive property of PopupReach Inc. or its licensors and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="leading-relaxed mt-4">
                You may not use, reproduce, modify, or distribute any content from the Services without our prior written consent. Any unauthorized use of our intellectual property may result in legal action.
              </p>
            </section>

            {/* Payment and Billing */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Payment and Billing</h2>
              <p className="leading-relaxed mb-3">
                If you purchase a subscription or other paid services, you agree to pay all applicable fees as described at the time of purchase. Payment terms include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Subscription Fees:</strong> Subscription fees are billed in advance on a recurring basis (e.g., monthly or annually) and are non-refundable except as required by law.</li>
                <li><strong>Payment Method:</strong> You must provide a valid payment method and authorize us to charge your payment method for all fees incurred.</li>
                <li><strong>Price Changes:</strong> We reserve the right to change our pricing at any time. We will provide notice of any price changes before they take effect.</li>
                <li><strong>Late Payments:</strong> If payment is not received by the due date, we may suspend or terminate your access to the Services.</li>
              </ul>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Disclaimers</h2>
              <p className="leading-relaxed mb-3">
                THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p className="leading-relaxed">
                PopupReach does not warrant that the Services will be uninterrupted, error-free, or free of viruses or other harmful components. We do not guarantee the accuracy, completeness, or reliability of any content or information provided through the Services.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Limitation of Liability</h2>
              <p className="leading-relaxed mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, POPUPREACH INC. AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="leading-relaxed">
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU PAID TO US IN THE SIX (6) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR $100 CAD, WHICHEVER IS GREATER.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify, defend, and hold harmless PopupReach Inc. and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorney's fees) arising out of or in connection with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Your use of the Services</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you submit or transmit through the Services</li>
              </ul>
            </section>

            {/* Third-Party Links and Services */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Third-Party Links and Services</h2>
              <p className="leading-relaxed">
                The Services may contain links to third-party websites or services that are not owned or controlled by PopupReach. We are not responsible for the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that PopupReach shall not be liable for any damage or loss caused by your use of any third-party content or services.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Termination</h2>
              <p className="leading-relaxed mb-3">
                We reserve the right to suspend or terminate your access to the Services at any time, with or without cause or notice, including if you violate these Terms. Upon termination:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your right to use the Services will immediately cease.</li>
                <li>We may delete your account and any content associated with it.</li>
                <li>You will remain liable for any obligations incurred prior to termination.</li>
              </ul>
              <p className="leading-relaxed mt-4">
                You may terminate your account at any time by contacting us at <a href="mailto:info@popupreach.com" className="text-[#e94e1b] hover:underline">info@popupreach.com</a>. Termination does not relieve you of any payment obligations for services already provided.
              </p>
            </section>

            {/* Confidentiality */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Confidentiality</h2>
              <p className="leading-relaxed">
                You may have access to confidential information related to PopupReach, including but not limited to business strategies, technical data, and proprietary algorithms. You agree to keep such information confidential and not disclose it to any third party without our prior written consent.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-4">Governing Law</h3>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the Province of Manitoba and the federal laws of Canada applicable therein, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-6">Jurisdiction</h3>
              <p className="leading-relaxed">
                Any disputes arising out of or related to these Terms or the Services shall be resolved exclusively in the courts of Manitoba, Canada. You consent to the personal jurisdiction of such courts and waive any objection to venue.
              </p>

              <h3 className="text-xl font-semibold text-[#343538] mb-3 mt-6">Arbitration</h3>
              <p className="leading-relaxed">
                For disputes not exceeding $25,000 CAD, either party may elect to resolve the dispute through binding arbitration in accordance with the rules of the ADR Institute of Canada. The arbitration shall take place in Winnipeg, Manitoba.
              </p>
            </section>

            {/* Compliance */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Compliance with Laws</h2>
              <p className="leading-relaxed">
                You agree to comply with all applicable local, provincial, federal, and international laws and regulations in connection with your use of the Services, including but not limited to Canadian privacy laws (PIPEDA), anti-spam legislation (CASL), and consumer protection laws.
              </p>
            </section>

            {/* Promotional Offers */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Promotional Offers and Discounts</h2>
              <p className="leading-relaxed mb-3">
                Businesses using PopupReach to promote offers are solely responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The accuracy and legality of their promotional content</li>
                <li>Honoring all advertised promotions and discounts</li>
                <li>Complying with applicable advertising and consumer protection laws</li>
                <li>Resolving any disputes with shoppers regarding promotions</li>
              </ul>
              <p className="leading-relaxed mt-4">
                PopupReach acts as a platform provider and is not responsible for the content, accuracy, or fulfillment of promotional offers created by businesses.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Changes to These Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify or update these Terms at any time. We will notify you of any material changes by posting the updated Terms on our website and updating the effective date. Your continued use of the Services after such changes constitutes your acceptance of the updated Terms.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Severability</h2>
              <p className="leading-relaxed">
                If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Entire Agreement</h2>
              <p className="leading-relaxed">
                These Terms, together with our Privacy Policy and any other legal notices or agreements published by us on the Services, constitute the entire agreement between you and PopupReach Inc. regarding your use of the Services and supersede all prior agreements and understandings.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Contact Us</h2>
              <p className="leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding these Terms, please contact us:
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
                By using PopupReach, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
