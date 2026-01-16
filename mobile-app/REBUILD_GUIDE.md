# Mobile App Rebuild Guide - Fix Crashes

## Problem
App crashes when clicking offers, view more, or claims tab after adding superadmin offers support.

## Root Causes Fixed
1. ✅ Missing `Image` import in ClaimCard
2. ✅ Unsafe Date() creation with null/undefined values
3. ✅ Missing null checks for offer properties
4. ✅ Async function called synchronously
5. ✅ Type coercion issues with canClaim/isDemo boolean fields
6. ✅ Missing defensive coding for malformed API data

## All Commits Applied
```
55bde88 - Add comprehensive defensive coding to prevent crashes
230f621 - Fix critical mobile app crashes
6496946 - Fix mobile app crash: properly handle async getTotalQuantityClaimed
e2ed4a5 - Add superadmin offers support to mobile app
```

## Rebuild Steps

### 1. Pull Latest Code
```bash
cd /home/sam/discount_fullstack
git pull origin main
cd mobile-app
```

### 2. Clean Everything
```bash
# Remove all caches and build artifacts
rm -rf node_modules
rm -rf .expo
rm -rf android/app/build
rm -rf ios/build
rm -rf .expo-shared
rm package-lock.json

# Clear Expo cache
npx expo start -c
```

### 3. Reinstall Dependencies
```bash
npm install
```

### 4. Verify API Configuration
Check `src/config/api.config.ts`:
```typescript
export const USE_LOCAL_API = false; // Should be false for production
export const PRODUCTION_API_URL = 'https://discount-fullstack.onrender.com/api/v1';
```

### 5. Test in Development First
```bash
# Start Expo dev server
npx expo start --clear

# Test on your device using Expo Go app
# Scan the QR code and test:
# ✓ Click on offer cards
# ✓ Click "View More" button
# ✓ View Claims tab
# ✓ Check superadmin offers show "IN-STORE" badge
```

### 6. Build Production APK

#### Option A: EAS Build (Recommended)
```bash
# Build for Android
eas build --platform android --profile production

# Wait for build to complete (10-15 minutes)
# Download APK from EAS dashboard
```

#### Option B: Local Build
```bash
# For Android
npx expo run:android --variant release
```

### 7. Install and Test
```bash
# Install the new APK on your devices
adb install path/to/new-app.apk

# Or download from EAS build page
```

## Testing Checklist

After installing the new build, verify:

### Basic Functionality
- [ ] App opens without crashing
- [ ] Home screen loads offers
- [ ] Offer cards display correctly

### Offer Details
- [ ] Click on any offer card - should open details
- [ ] Images display correctly
- [ ] Discount badge shows correct percentage
- [ ] Price information displays
- [ ] Claim button works for regular offers
- [ ] "Visit Store to Claim" banner shows for superadmin offers (no claim button)

### Navigation
- [ ] Click "View More" - should open list of offers
- [ ] Scroll through offer list
- [ ] Click offers from list

### Claims Tab
- [ ] Click on Claims tab
- [ ] Claimed offers display with redemption codes
- [ ] Can unclaim offers
- [ ] No crashes when viewing claim details

### Superadmin Offers
- [ ] Superadmin offers show "IN-STORE" badge on cards
- [ ] Opening superadmin offer shows blue info banner
- [ ] No claim button appears for superadmin offers
- [ ] Can favorite/save superadmin offers

## Debugging If Still Crashing

### 1. Check Logs
```bash
# Android logs
adb logcat | grep -i "react\|expo\|error"

# Or use React Native Debugger
npx react-devtools
```

### 2. Test API Directly
```bash
cd mobile-app
./test-api.sh
```

Should show:
```
✓ Endpoint working
  - can_claim: False
  - is_demo: True
```

### 3. Check App Version
Make sure you're testing the newly built APK, not an old cached version:
- Uninstall the old app completely
- Restart your device
- Install the new APK fresh

### 4. Test on Different Device
Try on a different Android device or emulator to rule out device-specific issues.

## Production Backend Verified ✅

Your production API is working correctly:
- ✅ Returns `can_claim: false` for superadmin offers
- ✅ Returns `is_demo: true` for superadmin offers
- ✅ Endpoint `/customer/all-offers` working
- ✅ Endpoint `/customer/all-offers/[id]` working

## Key Changes Summary

### 1. Transform Function (offersService.ts)
- Added validation for invalid offer objects
- Created fallback default offer
- Explicit boolean conversions: `=== true`, `=== false`
- Try-catch for parseFloat operations

### 2. Component Safety (DiscountDetailsScreen.tsx)
- Type checking before numeric operations
- Array.isArray() check for images
- Null checks for all property access
- Safe date handling

### 3. Card Components
- Explicit boolean checks for isDemo/canClaim
- Missing Image import added to ClaimCard

## Need Help?

If crashes persist after rebuilding:
1. Capture crash logs: `adb logcat > crash.log`
2. Note exact steps to reproduce
3. Check if crash happens on specific offers or all offers
4. Verify app.json version number was incremented
