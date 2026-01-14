#!/bin/bash

# Test Superadmin System
# Run this script to test your superadmin setup

echo "🔐 Testing Superadmin Authentication..."
echo ""

# Login
echo "1️⃣ Logging in as admin@popupreach.com..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@popupreach.com",
    "password": "popupreachadmin1"
  }')

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Check if superadmin
IS_SUPERADMIN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['is_superadmin'])" 2>/dev/null)
echo "Is Superadmin: $IS_SUPERADMIN"

if [ "$IS_SUPERADMIN" != "True" ]; then
  echo "❌ User is not a superadmin!"
  exit 1
fi

echo ""
echo "2️⃣ Testing superadmin endpoint access..."

# Test list offers
OFFERS_RESPONSE=$(curl -s -X GET http://localhost:8080/api/v1/superadmin/offers \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $OFFERS_RESPONSE"

if echo "$OFFERS_RESPONSE" | grep -q "Not authenticated\|403\|401"; then
  echo "❌ Authentication failed!"
  echo ""
  echo "Debug info:"
  echo "Full response: $OFFERS_RESPONSE"
  exit 1
fi

echo "✅ Superadmin endpoint accessible!"
echo ""

# Create a test offer
echo "3️⃣ Creating test demo offer..."

CREATE_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/superadmin/offers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Demo Coffee Shop",
    "business_address": "123 Test St, Toronto, ON",
    "phone_number": "+14165551234",
    "category_id": 1,
    "latitude": 43.6532,
    "longitude": -79.3832,
    "formatted_address": "123 Test St, Toronto, ON M5V 1A1",

    "offer_title": "50% Off All Lattes - Demo",
    "offer_description": "Test demo offer",
    "discount_type": "percentage",
    "discount_value": 50,
    "start_date": "2026-01-08T00:00:00Z",
    "expiry_date": "2026-02-08T23:59:59Z",
    "max_claims": 100
  }')

if echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
  echo "✅ Demo offer created successfully!"
  echo ""
  echo "Response:"
  echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
else
  echo "❌ Failed to create offer"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo ""
echo "4️⃣ Verifying offer appears in public endpoint..."

PUBLIC_RESPONSE=$(curl -s "http://localhost:8080/api/v1/customer/offers/all?page=1&size=10")
DEMO_COUNT=$(echo "$PUBLIC_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('counts', {}).get('demo_offers', 0))" 2>/dev/null)

echo "Demo offers in public endpoint: $DEMO_COUNT"

if [ "$DEMO_COUNT" -gt "0" ]; then
  echo "✅ Demo offers are visible to customers!"
else
  echo "⚠️  No demo offers found in public endpoint (might need to check filters)"
fi

echo ""
echo "🎉 Superadmin system test complete!"
echo ""
echo "💡 Your access token (save this):"
echo "$TOKEN"
