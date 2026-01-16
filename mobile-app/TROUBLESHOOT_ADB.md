# Troubleshooting ADB Connection - Pixel 7

## Issue: `adb devices` shows no devices

## Solution 1: WSL + Windows ADB (Recommended for WSL users)

Since you're using WSL (Windows Subsystem for Linux), USB devices don't directly connect to WSL. You need to use ADB from Windows.

### Step 1: Install ADB on Windows

1. **Download Platform Tools:**
   - Go to: https://developer.android.com/tools/releases/platform-tools
   - Download "platform-tools-latest-windows.zip"
   - Extract to `C:\platform-tools`

2. **Add to Windows PATH:**
   - Press `Win + X`, select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path", click "Edit"
   - Click "New", add: `C:\platform-tools`
   - Click "OK" on all dialogs

3. **Verify installation:**
   Open **Windows PowerShell** or **Command Prompt** and run:
   ```cmd
   adb version
   ```

### Step 2: Enable USB Debugging on Pixel 7

1. **Enable Developer Options:**
   - Open **Settings**
   - Scroll to **About phone**
   - Tap **Build number** 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go back to **Settings**
   - Tap **System**
   - Tap **Developer options**
   - Scroll down and enable **USB debugging**
   - (Optional) Also enable **Stay awake** - keeps screen on while charging

3. **Check USB Preferences:**
   - In Developer options, find **Default USB configuration**
   - Set it to **File Transfer** or **PTP** (not "Charging only")

### Step 3: Connect Pixel 7 to Computer

1. **Use a good USB cable:**
   - Use the original Google USB-C cable if possible
   - Some cables are charge-only and won't work for data transfer

2. **Connect phone to PC via USB**

3. **Check phone notification:**
   - Pull down notification shade
   - You should see "USB for file transfer" or similar
   - Tap it and ensure it's set to **File transfer** (not charging only)

4. **Authorize computer:**
   - When you connect, your Pixel 7 should show a popup: "Allow USB debugging?"
   - **Check "Always allow from this computer"**
   - Tap "Allow"

### Step 4: Test Connection in Windows

Open **Windows PowerShell** or **Command Prompt**:

```cmd
adb devices
```

Should show:
```
List of devices attached
XXXXXXXXXXXXXX  device
```

### Step 5: Access ADB from WSL

Now that ADB works in Windows, you can use it from WSL:

**Option A: Alias to Windows ADB (Easiest)**
```bash
# Add to your ~/.bashrc or ~/.zshrc
echo 'alias adb="/mnt/c/platform-tools/adb.exe"' >> ~/.bashrc
source ~/.bashrc

# Test
adb devices
```

**Option B: Use Windows ADB directly**
```bash
/mnt/c/platform-tools/adb.exe devices
```

**Option C: Create a wrapper script**
```bash
# Create the script
cat > ~/bin/adb << 'EOF'
#!/bin/bash
/mnt/c/platform-tools/adb.exe "$@"
EOF

# Make it executable
chmod +x ~/bin/adb

# Add ~/bin to PATH if not already
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Test
adb devices
```

---

## Solution 2: Fix USB Connection Issues

### Check USB Cable
- **Try different USB ports** on your computer
- **Try a different USB cable** - some cables are charge-only
- **Try the original Google USB-C cable**
- Avoid USB hubs - connect directly to computer

### Restart ADB Server
```bash
adb kill-server
adb start-server
adb devices
```

### Revoke USB Debugging Authorizations (Reset)
On your Pixel 7:
1. Go to **Settings** → **System** → **Developer options**
2. Tap **Revoke USB debugging authorizations**
3. Disconnect and reconnect USB cable
4. Approve the popup again

### Check USB Mode on Pixel 7
When connected, pull down notification:
- Should see "Android System - USB for file transfer"
- Tap it
- Select **File Transfer** (not "Charging" or "No data transfer")

---

## Solution 3: Install Google USB Drivers (Windows)

If still not working, you may need Google USB drivers:

1. **Download Google USB Driver:**
   - Go to: https://developer.android.com/studio/run/win-usb
   - Download "latest_usb_driver_windows.zip"
   - Extract to a folder

2. **Install Driver:**
   - Open **Device Manager** (Right-click Start → Device Manager)
   - Look for your Pixel 7 under:
     - "Portable Devices" or
     - "Other devices" (with yellow exclamation)
   - Right-click on it → "Update driver"
   - Choose "Browse my computer for drivers"
   - Navigate to extracted USB driver folder
   - Click "Next" to install

3. **Restart ADB:**
   ```cmd
   adb kill-server
   adb start-server
   adb devices
   ```

---

## Solution 4: Use Wireless ADB (No USB needed!)

If USB continues to have issues, you can use wireless ADB:

### Initial Setup (Needs USB once)
1. Connect Pixel 7 via USB (even if adb devices doesn't work)
2. Make sure phone and computer are on **same WiFi network**
3. On Windows PowerShell:
   ```cmd
   adb tcpip 5555
   ```
4. Disconnect USB cable
5. Find your phone's IP address:
   - Pixel 7: **Settings** → **About phone** → **IP address**
   - Or: **Settings** → **Network & internet** → **Wi-Fi** → Tap your network → IP address

6. Connect wirelessly:
   ```cmd
   adb connect YOUR_PHONE_IP:5555
   ```
   Example: `adb connect 192.168.1.100:5555`

7. Verify:
   ```cmd
   adb devices
   ```
   Should show: `192.168.1.100:5555    device`

### For Next Time (No USB needed)
Once set up, just run:
```bash
adb connect YOUR_PHONE_IP:5555
adb devices
```

---

## Solution 5: Alternative - Use Expo Development Build

If ADB continues to be problematic, you can view logs directly in the terminal:

```bash
cd /home/sam/discount_fullstack/mobile-app

# Start with logs visible
npx expo start --clear

# Or save to file
npx expo start --clear 2>&1 | tee ~/expo-logs.txt
```

Then:
1. Open your app (scan QR with Expo Go or your dev build)
2. Reproduce the crash
3. All errors will appear in the terminal/log file

---

## Quick Diagnostic Checklist

Run through this checklist:

### On Pixel 7:
- [ ] Developer options enabled?
- [ ] USB debugging enabled?
- [ ] "Stay awake" enabled (optional but helpful)
- [ ] USB connected in "File Transfer" mode (not charging)?
- [ ] Popup to authorize USB debugging appeared and accepted?
- [ ] "Always allow from this computer" checked?

### On Computer:
- [ ] ADB installed and in PATH?
- [ ] Using good USB cable (data transfer capable)?
- [ ] Connected to USB port directly (not through hub)?
- [ ] Google USB drivers installed (Windows)?
- [ ] ADB server running? (try `adb start-server`)

### Test Commands:
```bash
# Check ADB version
adb version

# Restart ADB
adb kill-server
adb start-server

# List devices
adb devices

# Should see your Pixel 7 listed
```

---

## Still Not Working?

### Last Resort Options:

1. **Reboot everything:**
   - Restart your Pixel 7
   - Restart your computer
   - Try again

2. **Try another computer:**
   - Test if your Pixel 7 connects to a different computer
   - This helps identify if it's phone or computer issue

3. **Use Android Studio:**
   - Install Android Studio
   - It includes ADB and all necessary drivers
   - Usually works better than standalone ADB

4. **Check Windows Firewall:**
   - Windows Security → Firewall & network protection
   - Temporarily disable to test
   - If this fixes it, add ADB to allowed apps

---

## After Connection Works

Once `adb devices` shows your Pixel 7, you can:

### Capture crash logs:
```bash
cd /home/sam/discount_fullstack/mobile-app
./capture-logs.sh
```

### Or manually:
```bash
adb logcat -c
adb logcat > ~/crash.log
# Reproduce crash
# Ctrl+C to stop
cat ~/crash.log | grep -i "error"
```

---

## Need More Help?

If still stuck, provide:
1. Your Windows version (Windows 10/11?)
2. Output of: `adb version` (from Windows)
3. Output of: `adb devices -l` (from Windows)
4. Screenshot of Device Manager showing your Pixel 7
5. Any error messages you see
