'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BusinessLayout from '@/components/BusinessLayout';
import { apiRequest, endpoints } from '@/lib/api';

export default function BusinessQRCodePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchQRCode();
    }
  }, [authLoading, user]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest(endpoints.business.qrCode);

      if (response.success) {
        setQrData(response.data);
      } else {
        setError(response.error || 'Failed to generate QR code');
      }
    } catch (err) {
      console.error('Error fetching QR code:', err);
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData?.qr_code) return;

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = qrData.qr_code;
    link.download = `${qrData.business_name.replace(/\s+/g, '_')}_QR_Code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);

    // Reset downloaded state after 3 seconds
    setTimeout(() => setDownloaded(false), 3000);
  };

  const printQRCode = () => {
    if (!qrData?.qr_code) return;

    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${qrData.business_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              max-width: 600px;
            }
            h1 {
              color: #e94e1b;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              margin-bottom: 30px;
              font-size: 18px;
            }
            img {
              max-width: 100%;
              height: auto;
              margin: 20px 0;
              border: 4px solid #e94e1b;
              border-radius: 8px;
            }
            .instructions {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
              text-align: left;
            }
            .instructions h3 {
              margin-top: 0;
              color: #333;
            }
            .instructions p {
              color: #666;
              line-height: 1.6;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${qrData.business_name}</h1>
            <p class="subtitle">Scan to View Our Exclusive Offers</p>
            <img src="${qrData.qr_code}" alt="QR Code" />
            <div class="instructions">
              <h3>How to Use This QR Code:</h3>
              <p>
                1. Print this page and display it prominently in your business<br/>
                2. Customers can scan the QR code with their smartphone camera<br/>
                3. They'll be directed to a page showing all your active offers<br/>
                4. Customers can claim and redeem offers directly from their phone
              </p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const copyURL = () => {
    if (!qrData?.customer_url) return;

    navigator.clipboard.writeText(qrData.customer_url);
    // You could add a toast notification here
    alert('URL copied to clipboard!');
  };

  if (authLoading || loading) {
    return (
      <BusinessLayout
        title="Business QR Code"
        subtitle="Generate QR code for your business"
        activeTab="qr-code"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating QR code...</p>
          </div>
        </div>
      </BusinessLayout>
    );
  }

  if (!user) {
    return null; // BusinessLayout will handle redirect
  }

  return (
    <BusinessLayout
      title="Business QR Code"
      subtitle="Display this QR code in your business for customers to view your offers"
      activeTab="qr-code"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="text-red-500 text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchQRCode}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* QR Code Display */}
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {qrData?.business_name}
                </h2>
                <div className="bg-white p-6 rounded-lg border-4 border-orange-600 inline-block">
                  <img
                    ref={canvasRef}
                    src={qrData?.qr_code}
                    alt="Business QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Scan to view offers
                </p>
              </div>

              {/* Actions & Info */}
              <div className="flex flex-col justify-center">
                <div className="space-y-4">
                  <button
                    onClick={downloadQRCode}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      downloaded
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    } text-white`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {downloaded ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      )}
                    </svg>
                    {downloaded ? 'Downloaded!' : 'Download QR Code'}
                  </button>

                  <button
                    onClick={printQRCode}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print QR Code
                  </button>

                  <button
                    onClick={copyURL}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </button>
                </div>

                {/* Customer URL */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrData?.customer_url || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-mono text-gray-600"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This is where customers will be directed when they scan the QR code
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How to Use Your QR Code
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Download or Print</h4>
                  <p className="text-sm text-gray-600">
                    Download the QR code image or print it directly from this page
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Display Prominently</h4>
                  <p className="text-sm text-gray-600">
                    Place the QR code where customers can easily see and scan it (counter, window, table)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Customers Scan</h4>
                  <p className="text-sm text-gray-600">
                    Customers use their phone camera to scan and view all your active offers
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Track Results</h4>
                  <p className="text-sm text-gray-600">
                    Monitor claims and redemptions through your analytics dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
