# Superadmin Dashboard Guide

## Overview

The Superadmin Dashboard allows you to create demo offers for businesses during the user acquisition phase. These offers appear to users but **cannot be claimed** (view-only).

## Accessing the Dashboard

### URL
- **Login**: `http://localhost:3000/admin/login`
- **Dashboard**: `http://localhost:3000/admin/offers`

### Login Credentials
```
Email: admin@popupreach.com
Password: admin123
```

## Features

### 1. Create Demo Offers
Create offers with complete business information in a single form:

#### Two Options for Business:
1. **Create New Business**: Fill in all business details
   - Business name, description
   - **Address with Google Autocomplete** (automatically captures coordinates)
   - Phone number, website
   - Category selection
   - Location coordinates captured automatically

2. **Use Existing Business**: Select from previously created demo businesses

#### Offer Details:
- Offer title and description
- Discount type (percentage, fixed, BOGO, etc.)
- Discount value
- Original and discounted prices
- Start and expiry dates
- Maximum claims (total and per user)
- Terms and conditions

### 2. View All Demo Offers
- Grid view of all created demo offers
- Shows business name, discount details, expiry date
- "View Only" badge to indicate these are demo offers

### 3. Delete Demo Offers
- Each offer card has a delete button
- Confirmation prompt before deletion
- Automatically refreshes the list

## How It Works

### Backend Integration
The dashboard connects to these API endpoints:
- `POST /api/v1/superadmin/offers` - Create offer
- `GET /api/v1/superadmin/offers` - List offers
- `DELETE /api/v1/superadmin/offers/{id}` - Delete offer
- `GET /api/v1/superadmin/businesses` - List businesses
- `GET /api/v1/customer/offers/categories` - Get categories

### Public Display
Demo offers automatically appear in the customer app at:
- Endpoint: `GET /api/v1/customer/all-offers`
- Marked with:
  - `source: "superadmin"`
  - `can_claim: false` (users cannot claim)
  - `is_demo: true`

## Starting the Frontend

If the frontend isn't running, start it with:

```bash
cd /home/sam/discount_fullstack/frontend
npm run dev
```

Then access the admin panel at `http://localhost:3000/admin/login`

## Files Created

### API Layer
- `/lib/admin-api.ts` - All admin API functions

### Pages
- `/app/admin/page.tsx` - Redirect page
- `/app/admin/login/page.tsx` - Login page
- `/app/admin/layout.tsx` - Admin layout with navigation
- `/app/admin/offers/page.tsx` - Main offers management page

## Security

- Only users with `is_superadmin: true` can access
- Token-based authentication
- Automatic redirect to login if unauthorized
- Separate admin token storage (doesn't interfere with business/customer auth)

## Workflow Example

1. Visit `http://localhost:3000/admin/login`
2. Login with superadmin credentials
3. Click "Create Demo Offer"
4. Fill in business details (or select existing)
   - Start typing in the address field
   - Google Places autocomplete will show suggestions
   - Select an address to automatically capture lat/lng
   - Green checkmark appears when coordinates are captured
5. Fill in offer details
6. Click "Create Demo Offer"
7. Offer appears immediately in:
   - Admin dashboard list
   - Customer app (view-only)

## Address Autocomplete

The address input uses Google Places Autocomplete API:
- Start typing any address (minimum 5 characters)
- Suggestions appear after 1 second delay
- Select a suggestion to auto-populate:
  - Formatted address
  - Latitude/longitude coordinates
  - Place ID
  - Address components
- A green checkmark confirms coordinates were captured
- If Google API is unavailable, you can still enter addresses manually

## Removing Demo Offers

When you're ready to remove the demo offer system:

1. **Frontend**: Delete the `/app/admin` directory
2. **Backend**: Set `enable_superadmin_offers: false` in config
3. **Database** (optional): Drop superadmin tables

The system is designed to be completely removable without affecting the main business/offers functionality.

## Troubleshooting

### Can't Login
- Verify backend is running on port 8080
- Check credentials are correct
- Check browser console for errors

### Offers Not Showing
- Verify feature flag `enable_superadmin_offers: true` in backend
- Check offer start/expiry dates are valid
- Verify offer has `is_active: true`

### API Errors
- Check backend logs at `/home/sam/discount_fullstack/discount_api/server.log`
- Verify all required fields are filled
- Check network tab in browser dev tools
