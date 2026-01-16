# How to Capture Mobile App Crash Logs

## Method 1: Using ADB (Recommended)

### Step 1: Install ADB

#### On Linux/WSL:
```bash
# Install Android SDK platform tools
sudo apt update
sudo apt install android-tools-adb android-tools-fastboot

# Or download directly
wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip
unzip platform-tools-latest-linux.zip
export PATH=$PATH:~/platform-tools
```

#### On Windows:
1. Download: https://developer.android.com/tools/releases/platform-tools
2. Extract to `C:\platform-tools`
3. Add to PATH:
   - Search "Environment Variables" in Windows
   - Edit "Path" variable
   - Add `C:\platform-tools`

#### On macOS:
```bash
brew install android-platform-tools
```

### Step 2: Connect Your Device

#### Enable USB Debugging on Android:
1. Go to **Settings** → **About phone**
2. Tap **Build number** 7 times (enables Developer options)
3. Go back to **Settings** → **System** → **Developer options**
4. Enable **USB debugging**
5. Connect phone to computer via USB

#### Verify Connection:
```bash
adb devices
```

Should show:
```
List of devices attached
XXXXXXXX    device
```

If shows "unauthorized", check phone for popup asking to allow USB debugging.

### Step 3: Capture Logs

#### Option A: Real-time logs (watch crashes as they happen)
```bash
# Clear old logs first
adb logcat -c

# Start watching logs
adb logcat | grep -E "(ReactNative|Expo|chromium|ExpoModulesCore|ERROR|FATAL)"
```

**Now open your app and reproduce the crash.** The terminal will show the error.

#### Option B: Save logs to file
```bash
# Clear old logs
adb logcat -c

# Start logging to file
adb logcat > ~/app-crash.log &

# Reproduce the crash in your app
# Then stop logging (Ctrl+C)

# View the log
cat ~/app-crash.log | grep -E "(ReactNative|Expo|ERROR|FATAL)" | tail -100
```

#### Option C: Capture only crash logs
```bash
adb logcat *:E > ~/crash-errors.log &
```

This captures only ERROR level and above.

### Step 4: Filter Useful Information

```bash
# Show only React Native errors
adb logcat | grep -i "ReactNative"

# Show only JavaScript errors
adb logcat | grep -i "JavaScriptError"

# Show only fatal crashes
adb logcat | grep -i "FATAL"

# Show errors from your app (replace with your package name)
adb logcat | grep "com.anonymous.discountfullstack"
```

---

## Method 2: Using Expo Developer Tools

If you're using Expo Go app or development build:

### Step 1: Start Expo with Logs
```bash
cd /home/sam/discount_fullstack/mobile-app
npx expo start --clear
```

### Step 2: Open App on Device
Scan QR code with Expo Go or your development build.

### Step 3: View Logs in Terminal
The terminal running `expo start` will show all console logs and errors in real-time.

### Step 4: Save Logs
```bash
# Run expo with output redirection
npx expo start --clear 2>&1 | tee ~/expo-logs.txt
```

Now all logs are saved to `expo-logs.txt` while also displaying in terminal.

---

## Method 3: Using React Native Debugger

### Step 1: Enable Remote Debugging
1. Open your app
2. Shake device or press **Ctrl+M** (Android emulator)
3. Select **"Debug"** or **"Open Debugger"**

### Step 2: Open Chrome DevTools
Your app will open Chrome at `http://localhost:19000/debugger-ui`

### Step 3: View Console
- Press **F12** to open DevTools
- Go to **Console** tab
- All JavaScript errors and logs appear here

### Step 4: Save Console Logs
Right-click in console → **Save as** → Save to file

---

## Method 4: Using Android Studio Logcat

### Step 1: Install Android Studio
Download from: https://developer.android.com/studio

### Step 2: Open Logcat
1. Open Android Studio
2. Bottom toolbar → Click **Logcat**
3. Or: **View** → **Tool Windows** → **Logcat**

### Step 3: Connect Device
Android Studio should auto-detect your connected device.

### Step 4: Filter Logs
- **Filter by app**: Select your app from dropdown
- **Filter by level**: Choose "Error" or "Fatal"
- **Search**: Use search box to find specific errors

### Step 5: Export Logs
Right-click in Logcat → **Copy** → Paste to file

---

## Method 5: Quick Log Capture Script

I've created a helper script for you:

```bash
cd /home/sam/discount_fullstack/mobile-app
./capture-logs.sh
```

This will:
1. Check if device is connected
2. Clear old logs
3. Start capturing logs
4. Save to timestamped file
5. Show live filtered output

---

## What to Look For in Logs

### Common Crash Indicators

#### 1. JavaScript Errors
```
ERROR  TypeError: Cannot read property 'xxx' of undefined
ERROR  ReferenceError: xxx is not defined
```

#### 2. React Native Errors
```
FATAL EXCEPTION: mqt_native_modules
ReactNativeJS: Error: ...
```

#### 3. Component Errors
```
Error: Element type is invalid: expected a string...
Error: Objects are not valid as a React child
```

#### 4. Network Errors
```
ERROR  [Error: Network request failed]
```

### Crash Location

Look for:
- **File name**: `DiscountDetailsScreen.tsx:123`
- **Component**: `DealCard`, `ClaimCard`
- **Function**: `transformOfferData`, `handleClaimOffer`

---

## Sending Logs to Me

### Best Format:

1. **Capture the crash**:
```bash
adb logcat -c
adb logcat > crash.log &
# Reproduce crash
# Ctrl+C to stop
```

2. **Filter important parts**:
```bash
cat crash.log | grep -E "(ReactNative|Expo|ERROR|FATAL)" > crash-filtered.log
```

3. **Get last 200 lines around crash**:
```bash
tail -200 crash.log > crash-relevant.log
```

### What to Include:

- Exact steps to reproduce
- Which screen/button causes crash
- Is it specific offers or all offers?
- Device model and Android version
- App version/build number

---

## Troubleshooting ADB

### Device Not Found
```bash
# Restart adb server
adb kill-server
adb start-server
adb devices
```

### Permission Denied
```bash
# On Linux, add udev rules
sudo usermod -aG plugdev $USER
# Logout and login again
```

### Multiple Devices
```bash
# List devices
adb devices

# Use specific device
adb -s DEVICE_ID logcat
```

---

## Example: Complete Crash Capture Workflow

```bash
# 1. Connect device and verify
adb devices

# 2. Clear old logs
adb logcat -c

# 3. Start capturing to file with live view
adb logcat | tee ~/crash-$(date +%Y%m%d-%H%M%S).log

# 4. Open your app and navigate to where it crashes

# 5. Crash happens - logs are captured!

# 6. Stop logging (Ctrl+C)

# 7. View error lines
cat ~/crash-*.log | grep -i "error\|fatal\|exception" | tail -50
```

---

## Quick Reference Commands

```bash
# Check connection
adb devices

# Clear logs
adb logcat -c

# Live logs (all)
adb logcat

# Live logs (errors only)
adb logcat *:E

# Save to file
adb logcat > crash.log

# Filter and save
adb logcat | grep -i "error" > errors.log

# Last 100 error lines
adb logcat | grep -i "error" | tail -100

# Specific app package
adb logcat | grep "com.yourapp"

# Restart ADB
adb kill-server && adb start-server
```
