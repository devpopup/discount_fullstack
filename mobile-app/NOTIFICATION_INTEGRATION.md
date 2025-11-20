# Quick Integration Guide

This guide shows you exactly what code to add to your existing files to integrate the notification system.

## Step 1: Install Packages

```bash
cd /home/sam/discount_fullstack/mobile-app
npx expo install expo-notifications expo-task-manager expo-background-fetch
```

## Step 2: Update AppNavigator.tsx

Add the NotificationSettings screen to your navigation:

```typescript
// At the top, add import
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

// Update RootStackParamList type
export type RootStackParamList = {
  MainTabs: undefined;
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  SignUp: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' | 'all' };
  NotificationSettings: undefined; // ADD THIS LINE
};

// Add screen to Stack.Navigator (before </Stack.Navigator>)
<Stack.Screen
  name="NotificationSettings"
  component={NotificationSettingsScreen}
  options={{
    title: 'Notification Settings',
    headerBackTitle: 'Back',
  }}
/>
```

## Step 3: Update ProfileScreen.tsx

Add a menu item to access notification settings:

```typescript
// At the top, add imports
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  NotificationSettings: undefined;
  // ... other screens
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

// In your component, add this menu item
export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  // ... existing code

  return (
    <ScrollView style={styles.container}>
      {/* ... existing menu items */}

      {/* ADD THIS MENU ITEM */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('NotificationSettings')}
      >
        <Ionicons name="notifications-outline" size={24} color="#333" />
        <Text style={styles.menuItemText}>Notification Settings</Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      {/* ... rest of menu items */}
    </ScrollView>
  );
}

// Add these styles if they don't exist
const styles = StyleSheet.create({
  // ... existing styles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
```

## Step 4: Update HomeScreen.tsx

Initialize notifications and geofencing:

```typescript
// At the top, add imports
import { useEffect } from 'react';
import {
  requestNotificationPermissions,
  setupNotificationListeners
} from '../services/notificationService';
import { setupGeofences } from '../services/geofencingService';
import { registerBackgroundOfferCheck } from '../services/offerMonitoringService';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  // ... existing state

  // ADD THIS useEffect
  useEffect(() => {
    initializeNotifications();
  }, [nearbyDeals]);

  // ADD THIS FUNCTION
  const initializeNotifications = async () => {
    try {
      // Request notification permissions
      const hasPermission = await requestNotificationPermissions();

      if (hasPermission) {
        // Setup notification listeners
        const cleanup = setupNotificationListeners(
          // Handle notification received while app is open
          (notification) => {
            console.log('Notification received:', notification);
          },
          // Handle notification tapped
          (response) => {
            const { offerId, type } = response.notification.request.content.data;
            if (offerId) {
              navigation.navigate('DiscountDetails', { offerId });
            }
          }
        );

        // Setup geofences for nearby offers (500m radius)
        if (nearbyDeals.length > 0) {
          await setupGeofences(nearbyDeals, 0.5);
        }

        // Register background monitoring for expiring/limited offers
        await registerBackgroundOfferCheck();

        return cleanup;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  // ... rest of component
}
```

## Step 5: Update app.json

Add notification and location configuration:

```json
{
  "expo": {
    "name": "PopupReach",
    "slug": "popupreach",
    "version": "1.0.0",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#e94e1b"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow PopupReach to use your location to notify you about nearby offers.",
          "locationAlwaysPermission": "Allow PopupReach to use your location to notify you about nearby offers even when the app is not in use.",
          "locationWhenInUsePermission": "Allow PopupReach to use your location to show you nearby offers."
        }
      ]
    ],
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "POST_NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED"
      ],
      "package": "com.yourcompany.popupreach"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.popupreach",
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

## Step 6: Test the Implementation

1. **Install packages:**
   ```bash
   cd /home/sam/discount_fullstack/mobile-app
   npx expo install expo-notifications expo-task-manager expo-background-fetch
   ```

2. **Run the app:**
   ```bash
   npx expo start
   ```

3. **Test notifications:**
   - Go to Profile > Notification Settings
   - Enable "Proximity Alerts"
   - Grant location permissions (Always)
   - Move near a business with an active offer
   - You should receive a notification

## Feature Summary

Once integrated, users will have access to:

### 1. Proximity Alerts 📍
- Automatic notifications when within 500m of active offers
- Shows discount percentage and distance
- Requires "Always" location permission

### 2. Expiring Soon Alerts ⏰
- Notifications when claimed/favorited offers expire in 2 hours or less
- Smart cooldown (won't spam)
- Background monitoring every hour

### 3. Limited Quantity Warnings 🔥
- Alerts when favorited offers have 5 or fewer claims left
- Helps users act before offers run out
- Checks hourly in background

### 4. Last Chance Reminders ⚠️
- Day-before-expiry notifications
- Scheduled notifications for saved offers
- Ensures users don't miss expiring deals

## Next Steps

After integration:

1. Test each notification type
2. Adjust geofence radius if needed (in setupGeofences call)
3. Customize notification messages
4. Add analytics tracking
5. Test on both iOS and Android devices
6. Submit app updates with new permissions

## Support

If you encounter issues:
1. Check the NOTIFICATION_SETUP.md for detailed troubleshooting
2. Verify all permissions are granted in device settings
3. Check logs for error messages
4. Test with location simulation tools
