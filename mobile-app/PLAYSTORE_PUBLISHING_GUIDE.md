# Google Play Store Publishing Guide

Complete guide to publishing PopupReach mobile app on the Google Play Store.

## Prerequisites

### 1. Google Play Developer Account
- Sign up at [Google Play Console](https://play.google.com/console)
- One-time registration fee: $25
- Verification takes 1-2 days

### 2. Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

## Step-by-Step Publishing Process

### Step 1: Configure Your App

Update `app.json` with production settings:

Key configuration to verify:
- `expo.name`: "PopupReach" ✓
- `expo.slug`: "mobile-app" (consider changing to "popupreach")
- `expo.version`: "1.0.0"
- `expo.android.package`: Should be unique (e.g., "com.popupreach.app")
- `expo.android.versionCode`: 1

Example configuration:
```json
{
  "expo": {
    "name": "PopupReach",
    "slug": "popupreach",
    "version": "1.0.0",
    "android": {
      "package": "com.popupreach.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### Step 2: Create EAS Configuration

```bash
cd /home/sam/discount_fullstack/mobile-app
eas build:configure
```

This creates `eas.json`. Update it for production:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Step 3: Build Production AAB

Build Android App Bundle for Play Store:

```bash
# Build for production
eas build --platform android --profile production
```

EAS will:
- Create signing credentials automatically
- Build your app in the cloud
- Provide download link when complete
- Store credentials securely for future builds

**Build time**: Typically 10-20 minutes

### Step 4: Download the Build

Once complete:
- Download the `.aab` file from the link provided
- Or download from [Expo dashboard](https://expo.dev)

### Step 5: Prepare Store Listing Assets

You'll need to create the following assets:

#### Required Graphics

1. **App Icon**: 512x512 PNG
   - High-res version of your app icon
   - No transparency
   - Location: Can use your existing `assets/icon.png` (resize to 512x512)

2. **Feature Graphic**: 1024x500 PNG
   - Promotional banner shown at top of store listing
   - Should include app branding and key message

3. **Screenshots**: Minimum 2, maximum 8
   - Phone screenshots (portrait or landscape)
   - Recommended: 1080x1920 or 1080x2340
   - Show key features of your app
   - Can use Android emulator to capture

4. **Privacy Policy URL** (Required)
   - Must be publicly accessible
   - Can host on GitHub Pages, your website, or use a privacy policy generator

#### Screenshot Tips
```bash
# Take screenshots from Android emulator:
# 1. Start emulator
# 2. Run: npx expo start --android
# 3. Navigate through your app
# 4. Press Ctrl+S (or Cmd+S on Mac) to save screenshots
# 5. Screenshots saved to: ~/Pictures/ or Desktop/
```

### Step 6: Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in app details:
   - **App name**: PopupReach
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - Accept declarations
4. Click **"Create app"**

### Step 7: Complete Store Listing

Navigate to **Store presence > Main store listing**:

#### App Details
- **App name**: PopupReach
- **Short description** (80 chars max):
  ```
  Discover amazing local deals and discounts from businesses near you
  ```

- **Full description** (4000 chars max):
  ```
  PopupReach connects you with exclusive deals and discounts from local businesses in your area.

  KEY FEATURES:
  • Discover Nearby Deals - Find offers from businesses around you
  • Real-time Notifications - Get alerts when you're near active deals
  • Trending Offers - See what deals are popular in your area
  • Expiring Soon - Don't miss out on time-sensitive offers
  • Coming Soon - Set reminders for upcoming deals you're interested in
  • Easy Redemption - Claim and redeem offers directly in-store

  SAVE MONEY:
  Browse through various categories and save on dining, shopping, entertainment, and more. Our app makes it easy to discover and claim exclusive discounts from local businesses.

  STAY UPDATED:
  Enable notifications to be the first to know about new deals, limited-time offers, and when you're near participating businesses.

  SUPPORT LOCAL:
  Help support local businesses while saving money on products and services you love.

  Download PopupReach today and start saving!
  ```

#### Graphics
- Upload **App icon** (512x512)
- Upload **Feature graphic** (1024x500)
- Upload **Phone screenshots** (at least 2)

#### Categorization
- **App category**: Shopping (or Business)
- **Tags**: deals, discounts, local, shopping, offers

#### Contact Details
- **Email**: your-support-email@example.com
- **Website**: (optional) Your website URL
- **Privacy policy**: URL to your privacy policy

Click **Save**

### Step 8: Complete App Content

#### A. Privacy Policy
1. Navigate to **Policy > App content**
2. Click **Privacy policy**
3. Enter your privacy policy URL
4. Click **Save**

**Need a privacy policy?** Use these generators:
- [PrivacyPolicies.com](https://www.privacypolicies.com/)
- [Termly](https://termly.io/products/privacy-policy-generator/)

#### B. Data Safety
1. Click **Data safety**
2. Complete questionnaire about data collection:
   - Does your app collect user data? (Yes if you collect emails, location, etc.)
   - Data types collected
   - Data usage and sharing
   - Security practices
3. Click **Save**

#### C. Target Audience and Content
1. Click **Target audience and content**
2. Select target age groups (likely 13+)
3. Complete questionnaire
4. Click **Save**

#### D. Content Ratings
1. Click **Content ratings**
2. Complete IARC questionnaire
3. Get ratings for different regions
4. Click **Save**

### Step 9: Set Up Release

#### A. Select Countries/Regions
1. Navigate to **Production > Countries/regions**
2. Select countries where you want to release
   - Start with: United States, Canada, United Kingdom
   - Or select "All countries"
3. Click **Save**

#### B. Create Production Release
1. Navigate to **Production > Releases**
2. Click **Create new release**
3. Upload your `.aab` file
4. Enter **Release name**: "1.0.0 - Initial Release"
5. Enter **Release notes**:
   ```
   Initial release of PopupReach

   Features:
   - Browse local deals and offers
   - Real-time notifications for nearby deals
   - Save and claim offers
   - View trending and expiring deals
   - Set reminders for upcoming offers
   ```
6. Review release
7. Click **Save**

### Step 10: Submit for Review

1. Go to **Publishing overview**
2. Ensure all sections have green checkmarks
3. Click **Send X changes for review**
4. Confirm submission

**Review timeline**:
- First submission: 3-7 days
- Updates: 1-3 days

## Post-Submission

### Check Review Status
Monitor your app's review status in the Play Console dashboard.

### Once Approved
- Your app will be live on Play Store within hours
- You'll receive email confirmation
- Store listing will be publicly accessible

### Updating Your App

When you need to release updates:

```bash
# 1. Update version in app.json
# Increment both version and versionCode
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}

# 2. Build new version
eas build --platform android --profile production

# 3. Upload to Play Console
# Navigate to Production > Create new release
# Upload new .aab file and submit
```

## Troubleshooting

### Build Failed
- Check `eas build:list` for error details
- Common issues:
  - Missing credentials (EAS handles this automatically)
  - Invalid app.json configuration
  - Dependency conflicts

### Review Rejected
Common rejection reasons:
- Missing privacy policy
- Incomplete data safety section
- Misleading screenshots or description
- Permissions not properly explained

### Testing Before Submission
Create a closed testing track:
1. Navigate to **Testing > Closed testing**
2. Create new release with test version
3. Add test users via email
4. Test thoroughly before production release

## Important Notes

1. **API Level Requirements**: Google Play requires targetSdkVersion 33+ (Expo handles this automatically)
2. **64-bit Requirement**: All apps must support 64-bit (Expo handles this)
3. **Store Credentials**: EAS manages signing credentials securely
4. **Version Management**: Always increment both `version` and `versionCode` for updates
5. **Testing**: Use internal/closed testing before production release

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Submit to Play Store (alternative to manual upload)
eas submit --platform android

# Cancel running build
eas build:cancel

# View credentials
eas credentials
```

## Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Listing Guidelines](https://support.google.com/googleplay/android-developer/answer/9859655)
- [Expo Submit Documentation](https://docs.expo.dev/submit/introduction/)

## Checklist

Before submitting, ensure you have:

- [ ] Google Play Developer account ($25)
- [ ] Updated app.json with correct package name and version
- [ ] Created EAS configuration
- [ ] Built production .aab file
- [ ] Created app icon (512x512)
- [ ] Created feature graphic (1024x500)
- [ ] Captured at least 2 screenshots
- [ ] Written app description
- [ ] Created/hosted privacy policy
- [ ] Completed data safety form
- [ ] Completed content rating questionnaire
- [ ] Selected release countries
- [ ] Uploaded .aab file
- [ ] Written release notes
- [ ] Reviewed all information
- [ ] Submitted for review

Good luck with your app launch!
