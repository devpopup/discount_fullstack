import * as ExpoLocation from 'expo-location';
import { Location } from '../types/offer';

/**
 * Get user's current location with permission
 */
export async function getUserLocation(): Promise<Location> {
  try {
    // Request permission
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.log('Location permission denied');
      return getDefaultLocation();
    }

    // Get current position
    const position = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return getDefaultLocation();
  }
}

/**
 * Get default location (fallback)
 */
export function getDefaultLocation(): Location {
  // Default to a central location - customize this
  return {
    lat: 40.7128, // New York City
    lng: -74.006,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number | null {
  if (!lat1 || !lng1 || !lat2 || !lng2) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number | null): string {
  if (!distance) return 'Distance unknown';

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }

  return `${distance.toFixed(1)}km away`;
}
