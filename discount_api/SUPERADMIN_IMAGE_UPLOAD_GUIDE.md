# Superadmin Offer Image Upload Implementation Guide

## Overview
This guide explains how to add image upload functionality to the superadmin offer creation form in the admin portal.

---

## Step 1: Run Database Migration

First, apply the database migration to add the `image_url` column:

```bash
cd discount_api/migrations

# Using psql
psql postgresql://your_db_url -f add_image_to_superadmin_offers.sql

# Or using Supabase CLI
supabase db push
```

Verify the migration:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'superadmin_offers' AND column_name = 'image_url';
```

---

## Step 2: Frontend - Add Image Upload to Admin Form

### Location
File: `frontend/app/admin/offers/page.tsx`

### Implementation

#### 2.1 Add State for Image Upload

```typescript
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [isUploadingImage, setIsUploadingImage] = useState(false);
```

#### 2.2 Create Image Upload Handler

```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const uploadImageToSupabase = async (file: File): Promise<string | null> => {
  try {
    setIsUploadingImage(true);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `superadmin/${fileName}`;

    // Upload to Supabase Storage (product-images bucket)
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return null;
  } finally {
    setIsUploadingImage(false);
  }
};
```

#### 2.3 Add Image Upload UI to Form

Add this section in your form (after business details, before offer details):

```tsx
{/* Image Upload Section */}
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Offer Image (Optional)
  </label>
  <div className="flex items-start space-x-4">
    <div className="flex-1">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      <p className="mt-1 text-xs text-gray-500">
        PNG, JPG, GIF up to 5MB. Recommended size: 800x600px
      </p>
    </div>

    {/* Image Preview */}
    {imagePreview && (
      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={() => {
            setImageFile(null);
            setImagePreview(null);
          }}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
  </div>
</div>
```

#### 2.4 Update Form Submission

Modify your `handleCreateOffer` function:

```typescript
const handleCreateOffer = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);

  try {
    let offerImageUrl = null;

    // Upload image if provided
    if (imageFile) {
      offerImageUrl = await uploadImageToSupabase(imageFile);
      if (!offerImageUrl) {
        throw new Error('Failed to upload image');
      }
    }

    const offerData = {
      // Business fields
      business_name: formData.business_name,
      business_description: formData.business_description,
      business_address: formData.business_address,
      phone_number: formData.phone_number,
      business_website: formData.business_website,
      latitude: formData.latitude,
      longitude: formData.longitude,
      formatted_address: formData.formatted_address,
      place_id: formData.place_id,

      // Offer fields
      offer_title: formData.offer_title,
      offer_description: formData.offer_description,
      offer_image_url: offerImageUrl,  // Add this line
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
      start_date: formData.start_date,
      expiry_date: formData.expiry_date,
      max_claims: formData.max_claims ? parseInt(formData.max_claims) : null,
      max_claims_per_user: formData.max_claims_per_user ? parseInt(formData.max_claims_per_user) : null,
      terms_conditions: formData.terms_conditions,

      // Type-specific fields (as before)
      // ...
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/superadmin/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(offerData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create offer');
    }

    const result = await response.json();
    console.log('Offer created successfully:', result);

    // Reset form including image
    setImageFile(null);
    setImagePreview(null);

    // Refresh offers list
    fetchOffers();

  } catch (err: any) {
    console.error('Error creating offer:', err);
    setError(err.message || 'Failed to create offer');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Step 3: Supabase Storage Setup

### 3.1 Verify Storage Bucket

Ensure the `product-images` bucket exists in Supabase:

1. Go to Supabase Dashboard → Storage
2. Check if `product-images` bucket exists
3. If not, create it with these settings:
   - Name: `product-images`
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

### 3.2 Storage Policies

Add these RLS policies if not already present:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read access
CREATE POLICY "Allow public to read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

---

## Step 4: Testing

### 4.1 Test Image Upload

1. Go to admin portal: `/admin/offers`
2. Fill out the offer creation form
3. Click "Choose File" and select an image
4. Verify preview appears
5. Submit the form
6. Check that offer is created with image_url

### 4.2 Verify Image Display

1. Check the offers list in admin portal - images should display on cards
2. Check the mobile app - superadmin offers should show images
3. Check the web app shopper view - demo offers should show images

### 4.3 Test Without Image

1. Create an offer without uploading an image
2. Verify it still works (image is optional)
3. Verify placeholder images appear on cards

---

## Step 5: Update Existing Offers (Optional)

If you want to add images to existing superadmin offers:

```sql
-- Example: Update specific offer
UPDATE superadmin_offers
SET image_url = 'https://your-supabase-url/storage/v1/object/public/product-images/your-image.jpg'
WHERE id = 'offer-uuid';

-- Bulk update with placeholder
UPDATE superadmin_offers
SET image_url = 'https://via.placeholder.com/800x600?text=Demo+Offer'
WHERE image_url IS NULL;
```

---

## Troubleshooting

### Images Not Uploading

1. Check Supabase storage bucket permissions
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. Check browser console for upload errors
4. Verify file size is under 5MB

### Images Not Displaying

1. Check that image_url is being saved in database
2. Verify the URL is publicly accessible
3. Check CORS settings in Supabase
4. Look for image URL in API responses

### Mobile App Issues

1. Ensure mobile app is fetching latest offer data
2. Check that image_url is included in offer transformation
3. Verify expo-image can load the URL
4. Check network connectivity

---

## Security Considerations

1. **File Type Validation**: Only allow image types (PNG, JPG, GIF, WebP)
2. **File Size Limit**: Enforce 5MB maximum
3. **Filename Sanitization**: Use random generated names to prevent conflicts
4. **Storage Path**: Use `superadmin/` folder to separate from business images
5. **Authentication**: Only superadmins can upload images
6. **Image Optimization**: Consider using Supabase image transformation for thumbnails

---

## Future Enhancements

1. **Image Cropping**: Add image cropper before upload
2. **Multiple Images**: Support gallery of images per offer
3. **Image Optimization**: Auto-resize large images
4. **CDN Integration**: Use CDN for faster image delivery
5. **Image Moderation**: Add content moderation for uploaded images

---

## Summary

After completing this implementation:

✅ Database has image_url column for superadmin offers
✅ Backend API accepts and returns image URLs
✅ Admin portal has image upload form
✅ Images are stored in Supabase Storage
✅ Mobile and web apps display offer images
✅ Superadmin offers have visual parity with business offers

All superadmin-created demo offers can now have attractive images to better showcase deals and drive user engagement!
