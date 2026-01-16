#!/bin/bash

# Test script to verify API responses
# Usage: ./test-api.sh [API_URL]

API_URL="${1:-https://discount-fullstack.onrender.com/api/v1}"

echo "========================================="
echo "Testing API: $API_URL"
echo "========================================="
echo ""

echo "1. Testing /customer/all-offers endpoint..."
echo "-------------------------------------------"
curl -s "$API_URL/customer/all-offers?page=1&size=2" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'offers' in data and len(data['offers']) > 0:
        offer = data['offers'][0]
        print('✓ Endpoint working')
        print(f'  - Offer ID: {offer.get(\"id\", \"MISSING\")}')
        print(f'  - Title: {offer.get(\"title\", \"MISSING\")}')
        print(f'  - can_claim: {offer.get(\"can_claim\", \"MISSING\")}')
        print(f'  - is_demo: {offer.get(\"is_demo\", \"MISSING\")}')
        print(f'  - source: {offer.get(\"source\", \"MISSING\")}')

        # Check if fields are present
        if 'can_claim' not in offer:
            print('  ⚠ WARNING: can_claim field missing!')
        if 'is_demo' not in offer:
            print('  ⚠ WARNING: is_demo field missing!')
    else:
        print('✗ No offers returned')
        print(f'Response: {data}')
except Exception as e:
    print(f'✗ Error: {e}')
"
echo ""

echo "2. Testing /customer/all-offers/[id] endpoint..."
echo "------------------------------------------------"
# Get first offer ID
OFFER_ID=$(curl -s "$API_URL/customer/all-offers?page=1&size=1" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['offers'][0]['id'] if data.get('offers') else '')" 2>/dev/null)

if [ -n "$OFFER_ID" ]; then
    echo "Testing with offer ID: $OFFER_ID"
    curl -s "$API_URL/customer/all-offers/$OFFER_ID" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'offer' in data:
        offer = data['offer']
        print('✓ Single offer endpoint working')
        print(f'  - can_claim: {offer.get(\"can_claim\", \"MISSING\")}')
        print(f'  - is_demo: {offer.get(\"is_demo\", \"MISSING\")}')

        if offer.get('can_claim') is None:
            print('  ⚠ WARNING: can_claim is null!')
        if offer.get('is_demo') is None:
            print('  ⚠ WARNING: is_demo is null!')
    else:
        print('✗ No offer returned')
except Exception as e:
    print(f'✗ Error: {e}')
"
else
    echo "✗ Could not get offer ID"
fi

echo ""
echo "========================================="
echo "Test complete"
echo "========================================="
