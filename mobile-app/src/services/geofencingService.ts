import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Offer } from '../types/offer';
import { sendProximityAlert } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GEOFENCING_TASK = 'background-geofencing-task';
const GEOFENCED_OFFERS_KEY = '@geofenced_offers';
const MAX_GEOFENCES = 20; // iOS limit is 20, Android varies

interface GeofencedOffer {
  offerId: string;
  title: string;
  businessName: string;
  discount: number;
  latitude: number;
  longitude: number;
  radius: number;
}

// Define the geofencing task
TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofencing task error:', error);
    return;
  }

  if (data) {
    const { eventType, region } = data as {
      eventType: Location.GeofencingEventType;
      region: Location.LocationRegion;
    };

    // Only trigger on entering a geofence
    if (eventType === Location.GeofencingEventType.Enter) {
      try {
        // Get the offer details from stored data
        const offersJson = await AsyncStorage.getItem(GEOFENCED_OFFERS_KEY);
        if (offersJson) {
          const offers: GeofencedOffer[] = JSON.parse(offersJson);
          const offer = offers.find(o => o.offerId === region.identifier);

          if (offer) {
            // Calculate distance to offer
            const currentLocation = await Location.getCurrentPositionAsync({});
            const distance = calculateDistance(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              offer.latitude,
              offer.longitude
            );

            // Send proximity notification
            await sendProximityAlert(
              offer.offerId,
              offer.title,
              offer.businessName,
              offer.discount,
              distance
            );
          }
        }
      } catch (err) {
        console.error('Error handling geofence enter:', err);
      }
    }
  }
});

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Request location permissions for geofencing
 */
export async function requestGeofencingPermissions(): Promise<boolean> {
  try {
    // Request foreground location permission
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('Foreground location permission not granted');
      return false;
    }

    // Request background location permission (required for geofencing)
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.log('Background location permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting geofencing permissions:', error);
    return false;
  }
}

/**
 * Check if geofencing is currently active
 */
export async function isGeofencingActive(): Promise<boolean> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
    return isRegistered;
  } catch (error) {
    console.error('Error checking geofencing status:', error);
    return false;
  }
}

/**
 * Setup geofences for nearby offers
 */
export async function setupGeofences(offers: Offer[], radiusKm: number = 0.5): Promise<void> {
  try {
    // Check permissions
    const hasPermissions = await requestGeofencingPermissions();
    if (!hasPermissions) {
      console.log('Geofencing permissions not granted');
      return;
    }

    // Filter offers that have valid coordinates
    const validOffers = offers.filter(
      offer => offer.latitude && offer.longitude && offer.latitude !== 0 && offer.longitude !== 0
    );

    // Sort by distance and take only the closest ones (up to MAX_GEOFENCES)
    const currentLocation = await Location.getCurrentPositionAsync({});
    const sortedOffers = validOffers
      .map(offer => ({
        ...offer,
        distanceToUser: calculateDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          offer.latitude!,
          offer.longitude!
        ),
      }))
      .sort((a, b) => a.distanceToUser - b.distanceToUser)
      .slice(0, MAX_GEOFENCES);

    // Create geofence regions
    const regions: Location.LocationRegion[] = sortedOffers.map(offer => ({
      identifier: offer.id,
      latitude: offer.latitude!,
      longitude: offer.longitude!,
      radius: radiusKm * 1000, // Convert km to meters
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    // Store geofenced offer details for the background task
    const geofencedOffers: GeofencedOffer[] = sortedOffers.map(offer => ({
      offerId: offer.id,
      title: offer.title,
      businessName: offer.businessName,
      discount: offer.discount,
      latitude: offer.latitude!,
      longitude: offer.longitude!,
      radius: radiusKm * 1000,
    }));

    await AsyncStorage.setItem(GEOFENCED_OFFERS_KEY, JSON.stringify(geofencedOffers));

    // Stop any existing geofencing
    if (await isGeofencingActive()) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
    }

    // Start geofencing
    if (regions.length > 0) {
      await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
      console.log(`Geofencing started for ${regions.length} offers`);
    }
  } catch (error) {
    console.error('Error setting up geofences:', error);
  }
}

/**
 * Stop geofencing
 */
export async function stopGeofencing(): Promise<void> {
  try {
    if (await isGeofencingActive()) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      await AsyncStorage.removeItem(GEOFENCED_OFFERS_KEY);
      console.log('Geofencing stopped');
    }
  } catch (error) {
    console.error('Error stopping geofencing:', error);
  }
}

/**
 * Update geofences with new offers
 */
export async function updateGeofences(offers: Offer[]): Promise<void> {
  try {
    if (await isGeofencingActive()) {
      await setupGeofences(offers);
    }
  } catch (error) {
    console.error('Error updating geofences:', error);
  }
}
