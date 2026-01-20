-- Storage Policies for product-images bucket
-- Run this in Supabase SQL Editor

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads to product-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy 2: Allow public read access to images
CREATE POLICY "Allow public read access to product-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy 3: Allow authenticated users to update their own images
CREATE POLICY "Allow authenticated updates to product-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Policy 4: Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated deletes from product-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Verify policies
SELECT
  policyname,
  tablename,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
