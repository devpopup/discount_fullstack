export interface Business {
  id?: string;
  business_name?: string;
  business_address?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phone_number?: string;
  phone?: string;
  business_website?: string;
  website?: string;
  avatar_url?: string;
  business_hours?: string | Record<string, string>;
  rating?: number;
  review_count?: number;
}

export interface Product {
  id?: string;
  price?: number;
  image_url?: string;
  category?: string;
  categories?: {
    name?: string;
  };
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  businessName: string;
  businessLogo?: string | null;
  discount: number;
  originalPrice: number;
  discountedPrice: number;
  category: string;
  location: string;
  distance?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  expiresAt?: string;
  startDate?: string;
  claimedCount: number;
  maxClaims?: number | null;
  isPopular: boolean;
  isFeatured: boolean;
  hasReminder?: boolean;
  images: string[];
  latitude: number;
  longitude: number;
  business?: Business | null;
}

export interface OffersResponse {
  offers: Offer[];
  hasMore: boolean;
  error: string | null;
}

export interface Location {
  lat: number;
  lng: number;
}
