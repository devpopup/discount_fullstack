import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GEOFENCING_TASK = 'background-geofencing-task';
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  proximityAlerts: boolean;
  expiringAlerts: boolean;
  limitedQuantityAlerts: boolean;
  lastChanceAlerts: boolean;
}

const defaultSettings: NotificationSettings = {
  proximityAlerts: true,
  expiringAlerts: true,
  limitedQuantityAlerts: true,
  lastChanceAlerts: true,
};

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // For Android, create notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e94e1b',
      });

      await Notifications.setNotificationChannelAsync('proximity', {
        name: 'Proximity Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Alerts when you are near offers',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e94e1b',
      });

      await Notifications.setNotificationChannelAsync('expiring', {
        name: 'Expiring Offers',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Notifications for expiring offers',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e94e1b',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return defaultSettings;
  }
}

/**
 * Save notification settings
 */
export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
}

/**
 * Send proximity alert notification
 */
export async function sendProximityAlert(
  offerId: string,
  title: string,
  businessName: string,
  discount: number,
  distance: number
): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.proximityAlerts) return;

    const distanceText = distance < 1
      ? `${Math.round(distance * 1000)}m away`
      : `${distance.toFixed(1)}km away`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 ${discount}% OFF Nearby!`,
        body: `${title} at ${businessName} - ${distanceText}`,
        data: { offerId, type: 'proximity' },
        sound: true,
        badge: 1,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending proximity alert:', error);
  }
}

/**
 * Send expiring soon notification
 */
export async function sendExpiringAlert(
  offerId: string,
  title: string,
  businessName: string,
  hoursRemaining: number
): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.expiringAlerts) return;

    const timeText = hoursRemaining < 1
      ? 'less than 1 hour'
      : `${Math.floor(hoursRemaining)} hours`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Offer Expiring Soon!',
        body: `${title} at ${businessName} expires in ${timeText}!`,
        data: { offerId, type: 'expiring' },
        sound: true,
        badge: 1,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending expiring alert:', error);
  }
}

/**
 * Send limited quantity warning
 */
export async function sendLimitedQuantityAlert(
  offerId: string,
  title: string,
  businessName: string,
  claimsLeft: number
): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.limitedQuantityAlerts) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Limited Quantity!',
        body: `Only ${claimsLeft} claims left for "${title}" at ${businessName}!`,
        data: { offerId, type: 'limited' },
        sound: true,
        badge: 1,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending limited quantity alert:', error);
  }
}

/**
 * Schedule last chance reminder (day before expiry)
 */
export async function scheduleLastChanceReminder(
  offerId: string,
  title: string,
  businessName: string,
  expiresAt: Date
): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.lastChanceAlerts) return;

    const now = new Date();
    const oneDayBefore = new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000);

    // Only schedule if expiry is more than 24 hours away
    if (oneDayBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Last Chance!',
          body: `"${title}" at ${businessName} expires tomorrow!`,
          data: { offerId, type: 'last_chance' },
          sound: true,
          badge: 1,
        },
        trigger: {
          date: oneDayBefore,
        },
      });
    }
  } catch (error) {
    console.error('Error scheduling last chance reminder:', error);
  }
}

/**
 * Cancel scheduled notification for an offer
 */
export async function cancelOfferNotifications(offerId: string): Promise<void> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    const offerNotifications = notifications.filter(
      (notif) => notif.content.data?.offerId === offerId
    );

    for (const notif of offerNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  } catch (error) {
    console.error('Error canceling offer notifications:', error);
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationTapped: (response: Notifications.NotificationResponse) => void
) {
  // Listen for notifications while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(onNotificationReceived);

  // Listen for user tapping on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationTapped);

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
