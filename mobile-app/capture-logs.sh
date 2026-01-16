#!/bin/bash

# Crash Log Capture Script
# This script helps capture Android app crash logs easily

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Mobile App Crash Log Capture Tool${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if adb is installed
if ! command -v adb &> /dev/null; then
    echo -e "${RED}✗ ADB not found!${NC}"
    echo ""
    echo "Please install ADB first:"
    echo "  Ubuntu/Debian: sudo apt install android-tools-adb"
    echo "  macOS: brew install android-platform-tools"
    echo "  Windows: Download from https://developer.android.com/tools/releases/platform-tools"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ ADB is installed${NC}"

# Check if device is connected
echo ""
echo "Checking for connected devices..."
DEVICE_COUNT=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${RED}✗ No devices connected!${NC}"
    echo ""
    echo "Please:"
    echo "  1. Connect your Android device via USB"
    echo "  2. Enable USB Debugging in Developer Options"
    echo "  3. Accept the USB debugging prompt on your device"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo -e "${GREEN}✓ Device connected${NC}"
adb devices | grep "device$"

# Create logs directory
LOGS_DIR="$HOME/mobile-app-logs"
mkdir -p "$LOGS_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOGS_DIR/crash-$TIMESTAMP.log"

echo ""
echo -e "${BLUE}Logs will be saved to:${NC}"
echo "  $LOG_FILE"
echo ""

# Clear old logs
echo "Clearing old logcat buffer..."
adb logcat -c
echo -e "${GREEN}✓ Old logs cleared${NC}"
echo ""

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}Starting log capture...${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo ""
echo "Instructions:"
echo "  1. The logs are being captured in the background"
echo "  2. Now open your app and reproduce the crash"
echo "  3. After the crash, press Ctrl+C to stop logging"
echo ""
echo -e "${BLUE}Showing filtered logs (errors and warnings):${NC}"
echo -e "${YELLOW}----------------------------------------${NC}"

# Start logging to file and display filtered output
adb logcat -v time | tee "$LOG_FILE" | grep --line-buffered -E "(ReactNative|Expo|ERROR|FATAL|Exception|chromium)" &
LOGCAT_PID=$!

# Wait for user to stop
trap "kill $LOGCAT_PID 2>/dev/null" EXIT
wait $LOGCAT_PID

echo ""
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}Log capture stopped${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo ""

# Analyze logs
echo "Analyzing captured logs..."
echo ""

ERROR_COUNT=$(grep -c -i "error" "$LOG_FILE" 2>/dev/null || echo "0")
FATAL_COUNT=$(grep -c -i "fatal" "$LOG_FILE" 2>/dev/null || echo "0")
EXCEPTION_COUNT=$(grep -c -i "exception" "$LOG_FILE" 2>/dev/null || echo "0")

echo -e "${BLUE}Summary:${NC}"
echo "  - Total errors found: $ERROR_COUNT"
echo "  - Fatal errors: $FATAL_COUNT"
echo "  - Exceptions: $EXCEPTION_COUNT"
echo ""

# Create filtered log with just errors
FILTERED_LOG="$LOGS_DIR/crash-$TIMESTAMP-ERRORS.log"
grep -i -E "(error|fatal|exception)" "$LOG_FILE" > "$FILTERED_LOG" 2>/dev/null

echo -e "${GREEN}✓ Full log saved:${NC} $LOG_FILE"
echo -e "${GREEN}✓ Error log saved:${NC} $FILTERED_LOG"
echo ""

# Show last errors
if [ -s "$FILTERED_LOG" ]; then
    echo -e "${RED}Last 20 error lines:${NC}"
    echo -e "${YELLOW}----------------------------------------${NC}"
    tail -20 "$FILTERED_LOG"
    echo -e "${YELLOW}----------------------------------------${NC}"
else
    echo -e "${GREEN}No errors found in logs!${NC}"
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Done!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "To view full logs:"
echo "  cat $LOG_FILE"
echo ""
echo "To view only errors:"
echo "  cat $FILTERED_LOG"
echo ""
echo "To search for specific text:"
echo "  grep -i 'search_term' $LOG_FILE"
echo ""
