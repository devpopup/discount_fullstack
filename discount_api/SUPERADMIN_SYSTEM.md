# Superadmin System Documentation

## Overview

The Superadmin system is a **temporary** user acquisition tool that allows designated superadmin accounts to create demo offers for businesses during the onboarding/testing phase. This system is **completely isolated** from the main business and offers system and can be **safely removed** without affecting production data.

## Key Characteristics

- **Temporary**: Designed to be removed after user acquisition phase
- **Drop-safe**: No dependencies from main system to superadmin system
- **View-only**: Users can see superadmin offers but **cannot claim them**
- **Feature-flagged**: Can be disabled via configuration without code changes

---

## Database Structure

### Tables Created

1. **`superadmin_businesses`** - Demo businesses created by superadmins
2. **`superadmin_offers`** - Demo offers linked to superadmin businesses
3. **`superadmin_offer_views`** - Analytics for offer views (optional)
4. **`superadmin_offer_clicks`** - Analytics for offer clicks (optional)

### Profile Changes

- Added `is_superadmin` boolean flag to `profiles` table

### Relationships

```
profiles (is_superadmin = true)
  └── creates → superadmin_businesses
                  └── contains → superadmin_offers
                                    ├── tracked by → superadmin_offer_views
                                    └── tracked by → superadmin_offer_clicks
```

**IMPORTANT**: No tables in the main system reference superadmin tables. All foreign keys use `ON DELETE SET NULL` or `CASCADE` to prevent issues when dropping.

---

## Installation

### 1. Run Migration

```bash
# Connect to your Supabase database and run:
psql -h <your-db-host> -U <user> -d <database> -f discount_api/migrations/add_superadmin_system.sql
```

Or through Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `discount_api/migrations/add_superadmin_system.sql`
3. Execute

### 2. Create Superadmin User

```sql
-- Option 1: Promote existing user to superadmin
UPDATE profiles
SET is_superadmin = true
WHERE email = 'admin@yourcompany.com';

-- Option 2: Register a new user through the API, then promote them
-- First register at POST /api/v1/auth/register
-- Then run:
UPDATE profiles
SET is_superadmin = true
WHERE email = 'superadmin@yourcompany.com';
```

### 3. Verify Installation

```bash
# Check if tables exist
psql -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'superadmin%';"

# Verify superadmin user
psql -c "SELECT id, email, is_superadmin FROM profiles WHERE is_superadmin = true;"
```

---

## Usage

### API Endpoints

All superadmin endpoints require authentication with `is_superadmin = true`.

#### Create Offer with Business (Main Endpoint)

```http
POST /api/v1/superadmin/offers
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  // Business Details
  "business_name": "Joe's Coffee Shop",
  "business_address": "123 Main St, Toronto, ON",
  "phone_number": "+14165551234",
  "category_id": 5,
  "latitude": 43.6532,
  "longitude": -79.3832,
  "formatted_address": "123 Main St, Toronto, ON M5V 1A1",

  // Offer Details
  "offer_title": "20% off all lattes",
  "offer_description": "Valid weekdays only",
  "discount_type": "percentage",
  "discount_value": 20,
  "start_date": "2026-01-10T00:00:00Z",
  "expiry_date": "2026-02-10T23:59:59Z",
  "max_claims": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Offer created successfully",
  "business": { ... },
  "offer": { ... }
}
```

#### List All Superadmin Offers

```http
GET /api/v1/superadmin/offers?page=1&size=20
Authorization: Bearer <superadmin-token>
```

#### Update Offer

```http
PUT /api/v1/superadmin/offers/{offer_id}
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  "offer_title": "25% off all lattes",
  "discount_value": 25
}
```

#### Delete Offer

```http
DELETE /api/v1/superadmin/offers/{offer_id}
Authorization: Bearer <superadmin-token>
```

#### Manage Businesses

```http
# List businesses
GET /api/v1/superadmin/businesses?page=1&size=20

# Get business
GET /api/v1/superadmin/businesses/{business_id}

# Update business
PUT /api/v1/superadmin/businesses/{business_id}

# Delete business (deletes all its offers)
DELETE /api/v1/superadmin/businesses/{business_id}
```

---

## Public Access (Customer View)

### Unified Offers Endpoint

Customers can see both regular and superadmin offers via:

```http
GET /api/v1/customer/offers/all?page=1&size=20&lat=43.6532&lng=-79.3832
```

**Response:**
```json
{
  "offers": [
    {
      "id": "...",
      "title": "20% off lattes",
      "source": "superadmin",      // Indicates demo offer
      "can_claim": false,           // Frontend should disable claim button
      "is_demo": true,              // Badge: "Demo Offer"
      "business": { ... },
      "distance_km": 2.5
    },
    {
      "id": "...",
      "title": "Buy 1 Get 1 Free",
      "source": "business",         // Regular business offer
      "can_claim": true,            // Can be claimed
      "is_demo": false,
      "business": { ... },
      "distance_km": 3.2
    }
  ],
  "total": 50,
  "counts": {
    "business_offers": 35,
    "demo_offers": 15
  }
}
```

### Frontend Integration

```typescript
// Example React/Next.js component
function OfferCard({ offer }) {
  return (
    <div>
      {offer.is_demo && <Badge>Demo Offer</Badge>}
      <h3>{offer.title}</h3>
      <p>{offer.business.business_name}</p>

      {/* Disable claim button for demo offers */}
      <button
        disabled={!offer.can_claim}
        onClick={() => claimOffer(offer.id)}
      >
        {offer.can_claim ? "Claim Offer" : "Preview Only"}
      </button>
    </div>
  );
}
```

---

## Feature Flag Control

### Disable Superadmin System

```env
# In .env file
ENABLE_SUPERADMIN_OFFERS=false
```

Or:

```python
# In app/core/config.py
enable_superadmin_offers: bool = False
```

**Effect:**
- Superadmin API endpoints become unavailable (404)
- Public endpoints stop returning superadmin offers
- No code changes required
- Can re-enable by setting back to `true`

---

## Removal Process

### When to Remove

- User acquisition goals met
- Sufficient real businesses onboarded
- Superadmin offers no longer needed
- System ready for full production

### Step-by-Step Removal

#### 1. Disable Feature (2-4 weeks before removal)

```env
ENABLE_SUPERADMIN_OFFERS=false
```

- Monitor for complaints
- Ensure no dependencies
- Confirm analytics look normal

#### 2. Backup Data (Optional)

```bash
# Export superadmin data before dropping
pg_dump -h <host> -U <user> -d <db> \
  -t superadmin_businesses \
  -t superadmin_offers \
  -t superadmin_offer_views \
  -t superadmin_offer_clicks \
  > superadmin_backup_$(date +%Y%m%d).sql
```

#### 3. Drop Database Tables

```sql
-- Run in Supabase SQL Editor or psql
-- (Also available in migration file, commented out)

-- Drop analytics tables first
DROP TABLE IF EXISTS superadmin_offer_clicks CASCADE;
DROP TABLE IF EXISTS superadmin_offer_views CASCADE;

-- Drop core superadmin tables
DROP TABLE IF EXISTS superadmin_offers CASCADE;
DROP TABLE IF EXISTS superadmin_businesses CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_superadmin_updated_at() CASCADE;

-- Remove superadmin flag from profiles (optional)
DROP INDEX IF EXISTS idx_profiles_is_superadmin;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_superadmin;

-- Verify cleanup
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'superadmin%';
-- Should return 0 rows
```

#### 4. Remove Code Files

```bash
# Remove superadmin-specific files
rm discount_api/app/models/superadmin.py
rm discount_api/app/schemas/superadmin.py
rm discount_api/app/api/routes/superadmin.py

# Remove migration file (optional, keep for history)
# rm discount_api/migrations/add_superadmin_system.sql
```

#### 5. Clean Up Code References

**In `main.py`:**
```python
# Remove this line:
from app.api.routes import auth, health, business, categories, customer, superadmin

# Change to:
from app.api.routes import auth, health, business, categories, customer

# Remove these lines:
if settings.enable_superadmin_offers:
    app.include_router(superadmin.router, prefix="/api/v1")
```

**In `customer.py`:**
```python
# Remove the entire /offers/all endpoint (lines 2261-2444)
# Or keep it but remove superadmin logic
```

**In `user.py` (models):**
```python
# Remove:
is_superadmin = Column(Boolean, default=False, nullable=False)
User = Profile  # Can keep or remove
```

**In `user.py` (schemas):**
```python
# Remove from UserProfile:
is_superadmin: bool = False
```

**In `dependencies.py`:**
```python
# Remove entire function:
async def get_current_superadmin_user(...):
    ...
```

**In `config.py`:**
```python
# Remove:
enable_superadmin_offers: bool = True
```

#### 6. Test After Removal

```bash
# Run tests
pytest

# Start server and verify
python -m uvicorn main:app --reload

# Check API docs
curl http://localhost:8001/docs
# Verify no /superadmin endpoints
```

#### 7. Update Documentation

- Remove this file
- Update API documentation
- Notify team of changes

---

## Security Considerations

### Access Control

- ✅ Only users with `is_superadmin = true` can create/modify superadmin content
- ✅ Superadmin offers are clearly marked as `source='superadmin'`
- ✅ Users cannot claim superadmin offers (enforced backend + frontend)
- ✅ Feature flag allows instant disable

### Data Isolation

- ✅ No foreign keys from main system to superadmin system
- ✅ Dropping superadmin tables won't break main system
- ✅ Superadmin data never mixes with production business data
- ✅ Clear separation in database and code

### Best Practices

1. **Limit Superadmin Accounts**: Only create superadmin for necessary team members
2. **Monitor Usage**: Track superadmin offer views vs claims attempts
3. **Set Expiry Dates**: Don't create long-lived demo offers
4. **Clear Labeling**: Ensure frontend clearly marks demo offers
5. **Regular Cleanup**: Periodically delete old/inactive superadmin offers

---

## Troubleshooting

### Superadmin Endpoints Return 404

**Cause**: Feature flag disabled
**Solution**:
```env
ENABLE_SUPERADMIN_OFFERS=true
```

### Superadmin Endpoints Return 403

**Cause**: User not marked as superadmin
**Solution**:
```sql
UPDATE profiles SET is_superadmin = true WHERE email = 'your-email@example.com';
```

### Offers Not Showing in Public Endpoint

**Cause**: Feature flag disabled or offers inactive/expired
**Solution**:
1. Check `enable_superadmin_offers = true`
2. Verify offer `is_active = true`
3. Check `expiry_date > now()` and `start_date <= now()`

### Import Errors After Creating Files

**Cause**: Missing `__init__.py` or circular imports
**Solution**:
```bash
# Restart server
# Check for circular imports in models
```

### Database Connection Issues

**Cause**: SQLAlchemy not configured properly
**Solution**: Verify `get_db()` dependency works and connection string is correct

---

## Examples

### Complete Workflow Example

```bash
# 1. Create superadmin user
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@test.com",
    "password": "superadmin123",
    "first_name": "Super",
    "last_name": "Admin"
  }'

# Then promote to superadmin in database

# 2. Login as superadmin
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@test.com",
    "password": "superadmin123"
  }'
# Save the access_token

# 3. Create demo offer
curl -X POST http://localhost:8001/api/v1/superadmin/offers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Demo Cafe",
    "business_address": "123 Test St",
    "phone_number": "+14165551234",
    "category_id": 1,
    "latitude": 43.6532,
    "longitude": -79.3832,
    "offer_title": "50% Off Coffee",
    "discount_type": "percentage",
    "discount_value": 50,
    "start_date": "2026-01-08T00:00:00Z",
    "expiry_date": "2026-02-08T23:59:59Z"
  }'

# 4. View all offers (public)
curl http://localhost:8001/api/v1/customer/offers/all?page=1&size=10

# 5. Clean up when done
curl -X DELETE http://localhost:8001/api/v1/superadmin/offers/<offer-id> \
  -H "Authorization: Bearer <token>"
```

---

## FAQ

**Q: Can real businesses claim their demo business after signup?**
A: No, by design. Real businesses start fresh. You can manually migrate data if needed.

**Q: Do superadmin offers count toward analytics?**
A: Yes, they have separate tracking tables (`superadmin_offer_views`, `superadmin_offer_clicks`).

**Q: Can I convert a superadmin offer to a real offer?**
A: Not automatically. You'd need to manually copy the data to the main `offers` table with a real `business_id`.

**Q: What happens if I drop superadmin tables while feature is enabled?**
A: The `/offers/all` endpoint will throw errors. Disable the feature flag first.

**Q: Can customers see which offers are demos?**
A: Yes, via `source='superadmin'` and `is_demo=true` flags in API responses.

---

## Support

For issues or questions:
1. Check this documentation
2. Review migration file comments: `migrations/add_superadmin_system.sql`
3. Check feature flag: `enable_superadmin_offers` in config
4. Verify database tables exist: `\dt superadmin*` in psql

---

## Version History

- **v1.0** (2026-01-07): Initial superadmin system implementation
  - Created superadmin tables
  - Added superadmin API endpoints
  - Integrated with public offers endpoint
  - Added feature flag control
