import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getClaimedOfferIds, getFavoritedOfferIds } from './offersService';
import {
  sendExpiringAlert,
  sendLimitedQuantityAlert,
  scheduleLastChanceReminder,
  getNotificationSettings
} from './notificationService';
import apiClient from './api';

const BACKGROUND_OFFER_CHECK_TASK = 'background-offer-check';
const LAST_CHECK_TIME_KEY = '@last_offer_check_time';
const NOTIFIED_OFFERS_KEY = '@notified_offers';

interface NotifiedOffer {
  offerId: string;
  type: 'expiring' | 'limited' | 'last_chance';
  timestamp: number;
}

// Define background task for checking offers
TaskManager.defineTask(BACKGROUND_OFFER_CHECK_TASK, async () => {
  try {
    console.log('Background offer check started');

    await checkExpiringOffers();
    await checkLimitedQuantityOffers();

    // Update last check time
    await AsyncStorage.setItem(LAST_CHECK_TIME_KEY, Date.now().toString());

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background offer check error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Check if we've already notified about this offer recently
 */
async function hasRecentlyNotified(
  offerId: string,
  type: 'expiring' | 'limited' | 'last_chance',
  cooldownHours: number = 24
): Promise<boolean> {
  try {
    const notifiedJson = await AsyncStorage.getItem(NOTIFIED_OFFERS_KEY);
    if (!notifiedJson) return false;

    const notified: NotifiedOffer[] = JSON.parse(notifiedJson);
    const now = Date.now();
    const cooldownMs = cooldownHours * 60 * 60 * 1000;

    // Clean up old entries
    const recentNotifications = notified.filter(
      n => now - n.timestamp < cooldownMs
    );

    // Save cleaned up list
    await AsyncStorage.setItem(NOTIFIED_OFFERS_KEY, JSON.stringify(recentNotifications));

    // Check if this specific offer/type was notified recently
    return recentNotifications.some(
      n => n.offerId === offerId && n.type === type && now - n.timestamp < cooldownMs
    );
  } catch (error) {
    console.error('Error checking notification history:', error);
    return false;
  }
}

/**
 * Mark an offer as notified
 */
async function markAsNotified(offerId: string, type: 'expiring' | 'limited' | 'last_chance'): Promise<void> {
  try {
    const notifiedJson = await AsyncStorage.getItem(NOTIFIED_OFFERS_KEY);
    const notified: NotifiedOffer[] = notifiedJson ? JSON.parse(notifiedJson) : [];

    notified.push({
      offerId,
      type,
      timestamp: Date.now(),
    });

    await AsyncStorage.setItem(NOTIFIED_OFFERS_KEY, JSON.stringify(notified));
  } catch (error) {
    console.error('Error marking as notified:', error);
  }
}

/**
 * Check for expiring offers (claimed and favorited)
 */
async function checkExpiringOffers(): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.expiringAlerts) return;

    // Get claimed and favorited offer IDs
    const claimedIds = await getClaimedOfferIds();
    const favoritedIds = await getFavoritedOfferIds();
    const allOfferIds = new Set([...Array.from(claimedIds), ...Array.from(favoritedIds)]);

    if (allOfferIds.size === 0) return;

    // Fetch offer details for each ID
    for (const offerId of allOfferIds) {
      try {
        const response = await apiClient.get(`/customer/offers/${offerId}`);
        const offer = response.data.offer;

        if (!offer || !offer.expiresAt) continue;

        const expiresAt = new Date(offer.expiresAt);
        const now = new Date();
        const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Send notifications at different intervals
        if (hoursRemaining <= 2 && hoursRemaining > 0) {
          // 2 hours or less remaining
          const alreadyNotified = await hasRecentlyNotified(offerId, 'expiring', 2);
          if (!alreadyNotified) {
            await sendExpiringAlert(
              offerId,
              offer.title,
              offer.businessName || offer.business?.business_name,
              hoursRemaining
            );
            await markAsNotified(offerId, 'expiring');
          }
        } else if (hoursRemaining <= 24 && hoursRemaining > 22) {
          // Last chance reminder (24 hours before)
          const alreadyNotified = await hasRecentlyNotified(offerId, 'last_chance', 24);
          if (!alreadyNotified && settings.lastChanceAlerts) {
            await scheduleLastChanceReminder(
              offerId,
              offer.title,
              offer.businessName || offer.business?.business_name,
              expiresAt
            );
            await markAsNotified(offerId, 'last_chance');
          }
        }
      } catch (error) {
        console.error(`Error checking offer ${offerId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error checking expiring offers:', error);
  }
}

/**
 * Check for limited quantity offers
 */
async function checkLimitedQuantityOffers(): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.limitedQuantityAlerts) return;

    // Get favorited offer IDs (not claimed, as those are already claimed)
    const favoritedIds = await getFavoritedOfferIds();

    if (favoritedIds.size === 0) return;

    // Fetch offer details for each ID
    for (const offerId of favoritedIds) {
      try {
        const response = await apiClient.get(`/customer/offers/${offerId}`);
        const offer = response.data.offer;

        if (!offer || !offer.maxClaims) continue;

        const claimsLeft = offer.maxClaims - (offer.currentClaims || offer.claimedCount || 0);

        // Send notification if low on claims
        if (claimsLeft <= 5 && claimsLeft > 0) {
          const alreadyNotified = await hasRecentlyNotified(offerId, 'limited', 12);
          if (!alreadyNotified) {
            await sendLimitedQuantityAlert(
              offerId,
              offer.title,
              offer.businessName || offer.business?.business_name,
              claimsLeft
            );
            await markAsNotified(offerId, 'limited');
          }
        }
      } catch (error) {
        console.error(`Error checking offer ${offerId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error checking limited quantity offers:', error);
  }
}

/**
 * Register background fetch task
 */
export async function registerBackgroundOfferCheck(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_OFFER_CHECK_TASK);

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_OFFER_CHECK_TASK, {
        minimumInterval: 60 * 60, // Check every hour
        stopOnTerminate: false, // Continue after app is closed
        startOnBoot: false, // Do not auto-start on device reboot without user action
      });
      console.log('Background offer monitoring registered');
    }
  } catch (error) {
    console.error('Error registering background offer check:', error);
  }
}

/**
 * Unregister background fetch task
 */
export async function unregisterBackgroundOfferCheck(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_OFFER_CHECK_TASK);
    console.log('Background offer monitoring unregistered');
  } catch (error) {
    console.error('Error unregistering background offer check:', error);
  }
}

/**
 * Check if background task is registered
 */
export async function isBackgroundCheckActive(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_OFFER_CHECK_TASK);
  } catch (error) {
    console.error('Error checking background task status:', error);
    return false;
  }
}

/**
 * Manually trigger offer check (for testing)
 */
export async function manualOfferCheck(): Promise<void> {
  try {
    await checkExpiringOffers();
    await checkLimitedQuantityOffers();
    console.log('Manual offer check completed');
  } catch (error) {
    console.error('Error in manual offer check:', error);
  }
}
