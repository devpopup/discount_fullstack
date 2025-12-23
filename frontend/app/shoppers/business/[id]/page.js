'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, MapPin, Clock } from 'lucide-react';
import { getImageUrl } from '@/lib/api';

export default function BusinessOffersPage() {
  const params = useParams();
  const businessId = params.id;

  const [offers, setOffers] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // App detection: Try to open mobile app first
  useEffect(() => {
    const appDeepLink = `popupreach://business/${businessId}`;

    // Detect if user is on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Try to open the app
      window.location.href = appDeepLink;

      // If app doesn't open within 2.5 seconds, the web page will continue to display
      // (The page loads in parallel, so users see content regardless)
    }
  }, []); // Empty deps - run only once on mount

  useEffect(() => {
    fetchBusinessOffers();
  }, [businessId]);

  const fetchBusinessOffers = async () => {
    try {
      setLoading(true);

      // Fetch offers for this business using the new dedicated endpoint
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      const response = await fetch(
        `${API_BASE}/customer/businesses/${businessId}/offers?page=1&limit=50`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch offers');
      }

      const data = await response.json();
      console.log('Business offers data:', data); // Debug log
      setOffers(data.offers || []);
      setBusiness(data.business || null);

    } catch (err) {
      console.error('Error fetching business offers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'No expiry';

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchBusinessOffers}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Reduced height */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            {business?.avatar_url && (
              <img
                src={business.avatar_url}
                alt={business.business_name}
                className="w-14 h-14 rounded-full border-2 border-white shadow-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {business?.business_name || 'Business Offers'}
              </h1>
              {business?.is_verified && (
                <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs mt-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          </div>
          <p className="text-white/90 text-sm">
            {offers.length} active {offers.length === 1 ? 'offer' : 'offers'} available
          </p>
        </div>
      </div>

      {/* Offers - Landscape on mobile, Portrait on tablet/desktop */}
      <div className="container mx-auto px-4 py-6">
        {offers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Offers Available</h2>
            <p className="text-gray-600">
              This business doesn't have any active offers at the moment. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4">
            {offers.map((offer) => {
              // Get image from various possible sources and convert to full URL
              const rawImageUrl = offer.product?.image_url || offer.image_url;
              const imageUrl = getImageUrl(rawImageUrl);
              const productName = offer.product?.name || offer.title || 'Special Offer';
              const originalPrice = Number(offer.product?.price || offer.original_price || 0);
              const discountedPrice = Number(offer.discounted_price || (originalPrice * (1 - offer.discount_percentage / 100)));
              const discountPercent = Number(offer.discount_percentage || 0);

              console.log('Offer:', offer.id, 'Image URL:', imageUrl); // Debug log

              return (
                <Link
                  key={offer.id}
                  href={`/shoppers/offers/${offer.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-row md:flex-col"
                >
                  {/* Image Section - Landscape on mobile, Portrait on tablet+ */}
                  <div className="relative w-32 h-32 md:w-full md:h-48 flex-shrink-0">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={productName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 128px, (max-width: 1024px) 33vw, 20vw"
                        onError={(e) => {
                          console.error('Image failed to load:', imageUrl);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <Tag className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Discount Badge */}
                    <div className="absolute top-2 left-2 bg-red-600 text-white font-bold px-2 py-1 rounded text-xs shadow-lg">
                      {discountPercent}% OFF
                    </div>

                    {/* Expiry Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {calculateTimeRemaining(offer.expiry_date)}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3 flex-1 flex flex-col">
                    {/* Price */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-orange-600">
                        ${discountedPrice.toFixed(2)}
                      </span>
                      {originalPrice > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          ${originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 flex-1">
                      {productName}
                    </h3>

                    {/* Location */}
                    {business?.business_address && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-auto">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="line-clamp-1">{business.business_address}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {offers.length > 0 && (
        <div className="bg-white border-t mt-8 py-6">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Want to discover more deals?
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Explore offers from thousands of businesses in your area
            </p>
            <a
              href="/shoppers"
              className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors shadow-md text-sm"
            >
              Browse All Deals
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
