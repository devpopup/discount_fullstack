# 📱 Native App Notification Triggers

## Overview

This document describes what triggers notifications in the PopupReach native mobile app based on the current implementation.

---

## Notification Types & Triggers

### 1. 🎯 Proximity/Geofencing Alerts

**Trigger:** User enters within 500m radius of an offer location

**How it works:**
- **Service:** `geofencingService.ts`
- **Setup:** Initialized in `HomeScreen.tsx` when app loads
- **Maximum:** 20 geofences at a time (iOS limit)
- **Prioritization:** Closest offers to user's current location
- **Background:** ✅ Works even when app is closed
- **Notification Format:**
  ```
  🎉 {discount}% OFF Nearby!
  {title} at {businessName} - {distance}
  ```

**Code Flow:**
```typescript
// HomeScreen initializes geofencing
await setupGeofences(nearbyDeals, 0.5); // 500m radius

// Background task monitors location
GeofencingEventType.Enter → sendProximityAlert()
```

**User Control:** Can disable via "Proximity Alerts" toggle in settings

---

### 2. ⏰ Expiring Offers Alerts

**Trigger:** Claimed or favorited offers expiring within 2 hours

**How it works:**
- **Service:** `offerMonitoringService.ts`
- **Check Frequency:** Every 1 hour (background task)
- **Monitored Offers:** All claimed + favorited offers
- **Thresholds:**
  - **≤2 hours remaining:** Immediate notification
  - **~24 hours remaining:** "Last chance" reminder scheduled
- **Cooldown Period:**
  - Expiring alerts: 2 hours
  - Last chance alerts: 24 hours
- **Background:** ✅ Works when app is closed
- **Notification Format:**
  ```
  ⏰ Offer Expiring Soon!
  {title} at {businessName} expires in {hours} hours!
  ```

**Code Flow:**
```typescript
// Background task runs every hour
BackgroundFetch (every 60 min) → checkExpiringOffers()
  → For each claimed/favorited offer:
     → If ≤2 hours remaining → sendExpiringAlert()
     → If ~24 hours remaining → scheduleLastChanceReminder()
```

**User Control:** Can disable via "Expiring Alerts" toggle in settings

---

### 3. 🔥 Limited Quantity Alerts

**Trigger:** Favorited offers have ≤5 claims remaining

**How it works:**
- **Service:** `offerMonitoringService.ts`
- **Check Frequency:** Every 1 hour (background task)
- **Monitored Offers:** Only favorited offers (not claimed ones)
- **Threshold:** When `claimsLeft ≤ 5`
- **Cooldown Period:** 12 hours
- **Background:** ✅ Works when app is closed
- **Notification Format:**
  ```
  🔥 Limited Quantity!
  Only {claimsLeft} claims left for "{title}" at {businessName}!
  ```

**Code Flow:**
```typescript
// Background task runs every hour
BackgroundFetch (every 60 min) → checkLimitedQuantityOffers()
  → For each favorited offer:
     → Calculate: claimsLeft = maxClaims - currentClaims
     → If claimsLeft ≤ 5 → sendLimitedQuantityAlert()
```

**User Control:** Can disable via "Limited Quantity Alerts" toggle in settings

---

### 4. ⚠️ Last Chance Reminders

**Trigger:** 24 hours before a claimed/favorited offer expires

**How it works:**
- **Service:** `offerMonitoringService.ts`
- **Type:** Scheduled notification (fires at specific time)
- **Monitored Offers:** All claimed + favorited offers
- **Scheduling:** Detected during hourly background check when offer has 22-24 hours remaining
- **Notification Format:**
  ```
  ⚠️ Last Chance!
  "{title}" at {businessName} expires tomorrow!
  ```

**Code Flow:**
```typescript
// Scheduled during background check
checkExpiringOffers()
  → If offer has 22-24 hours remaining → scheduleLastChanceReminder()
    → Notification scheduled to fire 24 hours before expiry
```

**User Control:** Can disable via "Last Chance Alerts" toggle in settings

---

## 🔄 Initialization & Background Tasks

### App Launch Sequence (HomeScreen.tsx)

When the app launches or when the user opens the Home screen:

```typescript
1. requestNotificationPermissions()
   → Ask user for notification permissions

2. setupGeofences(nearbyDeals, 0.5)
   → Create 500m radius geofences for 20 closest offers
   → Updates automatically as user moves

3. registerBackgroundOfferCheck()
   → Start hourly background monitoring task
   → Checks expiring and limited quantity offers
```

### Background Tasks

| Task Name | Service | Frequency | Runs When Closed? | Purpose |
|-----------|---------|-----------|-------------------|---------|
| **Geofencing** | `geofencingService.ts` | Real-time | ✅ Yes | Proximity alerts when entering offer radius |
| **Offer Monitoring** | `offerMonitoringService.ts` | Every 60 min | ✅ Yes | Check expiring/limited offers |

**Task Configuration:**
```typescript
BackgroundFetch.registerTaskAsync(BACKGROUND_OFFER_CHECK_TASK, {
  minimumInterval: 60 * 60,  // Check every hour
  stopOnTerminate: false,    // Continue after app is closed
  startOnBoot: true,         // Start when device boots
});
```

---

## 📊 Notification Settings

Users can control notifications via **Profile → Notifications** screen.

### Available Settings

| Setting | Default | Controls | Related Trigger |
|---------|---------|----------|----------------|
| **Proximity Alerts** | ✅ ON | Geofencing notifications | Proximity Alerts (#1) |
| **Expiring Alerts** | ✅ ON | 2-hour expiry warnings | Expiring Offers (#2) |
| **Limited Quantity Alerts** | ✅ ON | Low stock warnings (≤5 claims) | Limited Quantity (#3) |
| **Last Chance Alerts** | ✅ ON | 24-hour expiry reminders | Last Chance Reminders (#4) |

**Storage:** Settings saved to AsyncStorage at `@notification_settings`

---

## 📍 Permission Requirements

### Notification Permissions

**Required for:** All notification types
**Request:** On app first launch
**Platform:** iOS & Android

```typescript
await Notifications.requestPermissionsAsync()
```

### Location Permissions

**Required for:** Geofencing/Proximity alerts only
**Types needed:**
- Foreground location (when app is open)
- Background location (when app is closed)

**Request:**
```typescript
await Location.requestForegroundPermissionsAsync()
await Location.requestBackgroundPermissionsAsync()
```

**Note:** Background location is required for geofencing to work when app is closed.

---

## ⚡ Important Notes

### ❌ NOT Currently Triggered By:

The following do **NOT** trigger notifications in the current implementation:

- New offer created by businesses
- Offer price drops
- Offers matching user preferences/interests
- Push notifications from server/backend
- Manual triggers from business dashboard
- User account updates
- New businesses nearby
- Flash sales or time-limited promotions
- Friend recommendations or social features

### ✅ Requires:

For notifications to work:

- ✅ Notification permissions granted by user
- ✅ Background location permissions (for geofencing only)
- ✅ App installed on device (can be closed)
- ✅ User has claimed or favorited offers (for expiring/limited alerts)
- ✅ Offers have valid location data (for proximity alerts)
- ✅ Notification settings enabled (can be toggled individually)

### Platform Differences

**iOS:**
- Maximum 20 geofences at a time
- Strict background task limits
- Requires "Always" location permission for geofencing

**Android:**
- Typically supports 100+ geofences (varies by device)
- More flexible background task scheduling
- Separate notification channels for different alert types

### Performance Characteristics

**Battery Impact:**
- ✅ **Minimal** - 1-hour check interval for background tasks
- ✅ **Optimized** - Geofencing uses system-level location monitoring
- ✅ **Efficient** - Only 20 closest offers monitored at once

**Network Usage:**
- ✅ **Low** - Only fetches details for claimed/favorited offers
- ✅ **Minimal API calls** - Background task runs once per hour
- ✅ **No constant polling** - Geofencing is event-driven

**Storage:**
- Notification history stored locally in AsyncStorage
- Prevents duplicate notifications via cooldown tracking
- Key: `@notified_offers` - stores recent notifications with timestamps

---

## 🛠️ Technical Implementation Details

### Notification Channels (Android)

```typescript
// Default channel
{
  name: 'Default',
  importance: AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#e94e1b'
}

// Proximity alerts channel
{
  name: 'Proximity Alerts',
  importance: AndroidImportance.HIGH,
  description: 'Alerts when you are near offers'
}

// Expiring offers channel
{
  name: 'Expiring Offers',
  importance: AndroidImportance.DEFAULT,
  description: 'Notifications for expiring offers'
}
```

### Geofencing Configuration

```typescript
{
  identifier: offerId,           // Unique offer ID
  latitude: offer.latitude,      // Offer location
  longitude: offer.longitude,    // Offer location
  radius: 500,                   // 500 meters
  notifyOnEnter: true,          // Trigger when entering
  notifyOnExit: false           // Don't trigger when leaving
}
```

### Cooldown Mechanism

Prevents notification spam by tracking recent notifications:

```typescript
interface NotifiedOffer {
  offerId: string;
  type: 'expiring' | 'limited' | 'last_chance';
  timestamp: number;
}

// Cooldown periods:
// - Expiring alerts: 2 hours
// - Limited quantity: 12 hours
// - Last chance: 24 hours
```

---

## 🎯 Summary

### Notification Triggers Matrix

| Trigger Type | Frequency | Background | User Action Required | Settings Control |
|--------------|-----------|------------|---------------------|------------------|
| **Proximity** | Real-time | ✅ Yes | None - automatic | Proximity Alerts |
| **Expiring (2h)** | Hourly check | ✅ Yes | Must claim/favorite | Expiring Alerts |
| **Expiring (24h)** | Scheduled | ✅ Yes | Must claim/favorite | Last Chance Alerts |
| **Limited Qty** | Hourly check | ✅ Yes | Must favorite | Limited Quantity Alerts |

### Current Behavior

**What happens automatically:**
1. **Location-based:** User gets near an offer (500m radius)
2. **Time-based:** Offers expiring soon (2 hours or 24 hours)
3. **Inventory-based:** Limited quantities (≤5 claims left)

All triggers run **automatically in the background** even when the app is closed, as long as permissions are granted!

### Future Enhancements (Not Implemented)

Potential notification triggers that could be added:

- Server-sent push notifications for new offers
- Personalized recommendations based on user history
- Flash sales and time-limited promotions
- Social features (friends claiming offers)
- Business-initiated promotions
- Price drop alerts
- Category-based alerts

---

## 📝 Related Files

### Services
- `src/services/notificationService.ts` - Core notification functions
- `src/services/offerMonitoringService.ts` - Background offer monitoring
- `src/services/geofencingService.ts` - Location-based geofencing

### Screens
- `src/screens/HomeScreen.tsx` - Initializes notification services
- `src/screens/NotificationSettingsScreen.tsx` - User settings UI

### Configuration
- `app.json` - Notification permissions and configuration

---

**Last Updated:** December 2025
**App Version:** 1.0.0
**Platform:** React Native (Expo)
