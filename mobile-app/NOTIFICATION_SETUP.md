# Notification System Setup Guide

This guide explains how to set up and use the comprehensive notification system in the mobile app.

## Features

The notification system provides four types of alerts:

1. **Proximity Alerts** - Get notified when you enter the geofence radius of active offers
2. **Expiring Soon Alerts** - Notifications when your saved/claimed offers expire in 2 hours or less
3. **Limited Quantity Warnings** - Alerts when offers you saved have 5 or fewer claims remaining
4. **Last Chance Reminders** - Day-before-expiry notifications for your saved offers

## Installation

### 1. Install Required Packages

```bash
cd mobile-app
npx expo install expo-notifications expo-task-manager expo-background-fetch
```

### 2. Configure app.json

Add the following configuration to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#e94e1b",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to notify you about nearby offers.",
          "locationAlwaysPermission": "Allow $(PRODUCT_NAME) to use your location to notify you about nearby offers even when the app is not in use.",
          "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to notify you about nearby offers."
        }
      ]
    ],
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "POST_NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "SCHEDULE_EXACT_ALARM"
      ],
      "useNextNotificationsApi": true
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "location",
          "fetch",
          "remote-notification"
        ],
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to notify you about nearby offers.",
        "NSLocationWhenInUseUsageDescription": "We need your location to show you nearby offers.",
        "NSLocationAlwaysUsageDescription": "We need your location even when the app is closed to notify you about nearby offers."
      }
    }
  }
}
```

### 3. Update App Navigator

Add the NotificationSettings screen to your navigation:

```typescript
// In AppNavigator.tsx
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

// Add to RootStackParamList
export type RootStackParamList = {
  // ... existing routes
  NotificationSettings: undefined;
};

// Add screen
<Stack.Screen
  name="NotificationSettings"
  component={NotificationSettingsScreen}
  options={{
    title: 'Notification Settings',
    headerBackTitle: 'Back',
  }}
/>
```

### 4. Add Settings Link to Profile

Update ProfileScreen.tsx to include a link to notification settings:

```typescript
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => navigation.navigate('NotificationSettings')}
>
  <Ionicons name="notifications-outline" size={24} color="#333" />
  <Text style={styles.menuItemText}>Notification Settings</Text>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>
```

### 5. Initialize Notifications in App

Update your `HomeScreen.tsx` to initialize notifications:

```typescript
import { useEffect } from 'react';
import { requestNotificationPermissions, setupNotificationListeners } from '../services/notificationService';
import { setupGeofences } from '../services/geofencingService';
import { registerBackgroundOfferCheck } from '../services/offerMonitoringService';

export default function HomeScreen({ navigation }) {
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    // Request permissions
    const hasPermission = await requestNotificationPermissions();

    if (hasPermission) {
      // Setup notification listeners
      const cleanup = setupNotificationListeners(
        // Handle notification received
        (notification) => {
          console.log('Notification received:', notification);
        },
        // Handle notification tapped
        (response) => {
          const { offerId } = response.notification.request.content.data;
          if (offerId) {
            navigation.navigate('DiscountDetails', { offerId });
          }
        }
      );

      // Setup geofences for nearby offers
      if (nearbyDeals.length > 0) {
        await setupGeofences(nearbyDeals, 0.5); // 500m radius
      }

      // Register background monitoring
      await registerBackgroundOfferCheck();

      return cleanup;
    }
  };

  // ... rest of component
}
```

## Usage

### 1. Enable Notifications

Users can enable/disable specific notification types from the Notification Settings screen:

- Navigate to Profile > Notification Settings
- Toggle each notification type on/off
- Permissions will be requested automatically when enabling

### 2. Proximity Alerts

When enabled:
- App monitors up to 20 closest offers with active geofences
- User receives notification when entering 500m radius of an offer
- Requires "Always" location permission

### 3. Background Monitoring

When any of the following are enabled:
- Expiring soon alerts
- Limited quantity warnings
- Last chance reminders

The app will:
- Check offers every hour in the background
- Send notifications based on user's claimed/favorited offers
- Use smart cooldown periods to avoid spam (notifications sent once every 2-24 hours per offer)

## Testing

### Test Proximity Alerts

1. Enable "Proximity Alerts" in settings
2. Grant location permissions (Always)
3. Move within 500m of a business with an active offer
4. You should receive a notification

### Test Expiring Alerts

1. Enable "Expiring Soon" alerts
2. Claim or favorite an offer that expires in less than 2 hours
3. Wait for background check (runs every hour)
4. You should receive notification

### Manual Testing

You can manually trigger offer checks for testing:

```typescript
import { manualOfferCheck } from '../services/offerMonitoringService';

// In your component
const handleTestNotifications = async () => {
  await manualOfferCheck();
  Alert.alert('Success', 'Manual offer check completed');
};
```

## Architecture

### Services

1. **notificationService.ts** - Core notification functionality
   - Permission requests
   - Notification scheduling
   - Notification channels (Android)
   - Badge management

2. **geofencingService.ts** - Location-based notifications
   - Geofence setup and management
   - Background location monitoring
   - Proximity alert triggering

3. **offerMonitoringService.ts** - Background monitoring
   - Expiring offer checks
   - Limited quantity checks
   - Smart notification cooldowns

### Background Tasks

- **GEOFENCING_TASK** - Monitors location and triggers proximity alerts
- **BACKGROUND_OFFER_CHECK_TASK** - Checks offers every hour for expiring/limited

## Troubleshooting

### Notifications not appearing

1. Check device notification settings
2. Verify app has notification permissions
3. Ensure background refresh is enabled (iOS)
4. Check battery optimization settings (Android)

### Geofencing not working

1. Verify location permissions are set to "Always"
2. Check that location services are enabled
3. Ensure offers have valid coordinates
4. Test with location simulation

### Background tasks not running

1. Check battery optimization settings
2. Verify background refresh is enabled
3. Test with app in background
4. Check task manager logs

## Best Practices

1. **Battery Optimization**
   - Use appropriate geofence radius (500m recommended)
   - Limit number of geofences (max 20)
   - Set reasonable background check intervals (1 hour)

2. **User Experience**
   - Request permissions at appropriate times
   - Explain why permissions are needed
   - Allow users to customize notification types
   - Implement notification cooldowns

3. **Performance**
   - Clean up old notifications regularly
   - Remove expired geofences
   - Use efficient background tasks

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Background Fetch Documentation](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Expo Task Manager Documentation](https://docs.expo.dev/versions/latest/sdk/task-manager/)
