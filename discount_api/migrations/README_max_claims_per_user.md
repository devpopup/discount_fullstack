# Max Claims Per User Feature - Backend Implementation

## Overview
This feature allows businesses to limit how many times a single user can claim an offer. This is useful for scenarios like:
- "Each customer can claim this offer up to 3 times"
- "Limit: 2 claims per customer"
- Preventing abuse while still allowing repeat claims

## Changes Made

### 1. Database Migration (`add_max_claims_per_user.sql`)

**Location**: `/home/sam/discount_fullstack/discount_api/migrations/add_max_claims_per_user.sql`

**What it does**:
- Adds `max_claims_per_user` column to the `offers` table
- Column type: INTEGER (nullable)
- Default value: NULL (no per-user limit)
- Includes check constraint to ensure positive values
- Creates index on `claimed_offers(user_id, offer_id)` for faster lookups

**How to apply**:
Run this SQL script in your Supabase SQL editor:

```bash
# Copy the content of add_max_claims_per_user.sql and run it in Supabase
```

Or connect to your database and run:
```bash
psql -U postgres -h <your-supabase-host> -d postgres -f migrations/add_max_claims_per_user.sql
```

### 2. Backend Schema Updates

**Files Modified**:
- `app/schemas/business.py`

**Changes**:
- Added `max_claims_per_user: Optional[int]` to `OfferBase` (line 161)
- Added `max_claims_per_user: Optional[int]` to `OfferUpdate` (line 202)
- Added `max_claims_per_user: Optional[int]` to extended `OfferBase` (line 632)
- Added `max_claims_per_user: Optional[int]` to extended `OfferUpdate` (line 734)

**Impact**:
- OfferCreate, OfferResponse will automatically inherit this field
- API will accept and return `max_claims_per_user` in all offer endpoints

### 3. Claim Validation Logic

**File Modified**: `app/api/routes/customer.py`

**Location**: Lines 611-628 in the `claim_offer` endpoint

**What changed**:
1. **Before**: Simple check if user already claimed (boolean)
2. **After**: Count how many times user has claimed and compare against `max_claims_per_user`

**Validation Logic**:
```python
# Count user's existing claims for this offer
user_claims = supabase_admin.table("claimed_offers")
    .select("id")
    .eq("user_id", current_user.id)
    .eq("offer_id", offer_id)
    .execute()
user_claim_count = len(user_claims.data)

# Check if limit reached
if max_claims_per_user and user_claim_count >= max_claims_per_user:
    raise HTTPException(
        status_code=400,
        detail=f"You have reached the maximum limit of {max_claims_per_user} claim(s)"
    )

# Backward compatibility: if no limit set, allow only 1 claim per user
if not max_claims_per_user and user_claim_count > 0:
    raise HTTPException(
        status_code=400,
        detail="You have already claimed this offer"
    )
```

## How It Works

### Scenario 1: No per-user limit set (`max_claims_per_user = NULL`)
- **Behavior**: User can only claim once (backward compatible)
- **Example**: Existing offers will continue to work as before

### Scenario 2: Per-user limit set (`max_claims_per_user = 3`)
- **Behavior**: User can claim up to 3 times
- **Example**: User claims 3 times, then gets error: "You have reached the maximum limit of 3 claim(s)"

### Scenario 3: Unlimited per-user claims
- **How**: Don't set `max_claims_per_user` or set `max_claims` only
- **Note**: If you want truly unlimited per-user claims, you'll need to modify the logic to skip the backward compatibility check

## API Changes

### Creating an Offer with max_claims_per_user

**Request**:
```json
POST /api/v1/business/offers
{
  "title": "Summer Sale - 50% Off",
  "description": "Limited time offer",
  "discount_type": "percentage",
  "discount_value": 50,
  "original_price": 100,
  "discounted_price": 50,
  "start_date": "2025-11-28T00:00:00Z",
  "expiry_date": "2025-12-31T23:59:59Z",
  "max_claims": 100,
  "max_claims_per_user": 3,
  "product_id": "..."
}
```

### Response Example:
```json
{
  "id": "...",
  "title": "Summer Sale - 50% Off",
  "max_claims": 100,
  "max_claims_per_user": 3,
  "current_claims": 0,
  ...
}
```

### Claim Attempt Response (when limit reached):
```json
{
  "detail": "You have reached the maximum limit of 3 claim(s) for this offer"
}
```

## Testing Checklist

After running the migration, test the following:

1. **Create offer without max_claims_per_user**
   - Verify user can only claim once (backward compatibility)

2. **Create offer with max_claims_per_user = 2**
   - Claim as user A (should succeed)
   - Claim again as user A (should succeed)
   - Claim third time as user A (should fail with limit error)
   - Claim as user B (should succeed - separate counter)

3. **Update existing offer to add max_claims_per_user**
   - Verify field is updated
   - Verify claims work with new limit

4. **Check offer response includes max_claims_per_user**
   - GET /api/v1/customer/offers
   - GET /api/v1/customer/offers/{id}

## Next Steps (Frontend Implementation)

1. **Display max_claims_per_user when showing offers**
   - Show badge: "Up to 3 claims per customer"
   - Show remaining claims for logged-in user

2. **Add max_claims_per_user to offer creation form**
   - Optional field in business dashboard
   - Validation: must be positive integer

3. **Show claim code after claiming**
   - Already implemented in backend (unique_claim_id)
   - Display the 8-digit code to user
   - Format: AB12CD34

4. **Merchant redemption interface**
   - Input field for 8-digit code
   - Use existing endpoints:
     - POST /api/v1/business/redeem/verify
     - POST /api/v1/business/redeem/complete

## Files Changed Summary

```
discount_api/
├── migrations/
│   ├── add_max_claims_per_user.sql (NEW)
│   └── README_max_claims_per_user.md (NEW - this file)
├── app/
│   ├── schemas/
│   │   └── business.py (MODIFIED - added max_claims_per_user)
│   └── api/
│       └── routes/
│           └── customer.py (MODIFIED - updated claim validation)
```

## Backward Compatibility

This update is **backward compatible**:
- Existing offers without `max_claims_per_user` will default to NULL
- NULL means "one claim per user" (current behavior)
- No breaking changes to existing API contracts
- Existing claims remain valid

## Support

For questions or issues:
- Check backend logs for detailed claim validation errors
- Verify database migration was applied successfully
- Test with curl or Postman before frontend integration
