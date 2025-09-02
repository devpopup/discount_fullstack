import React, { useState, useRef } from 'react'
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiRequest, endpoints } from '@/lib/api'

export default function LogoUpload({ 
  currentLogoUrl, 
  onLogoUpdate, 
  className = "",
  size = "large" // "small", "medium", "large"
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(currentLogoUrl)
  const fileInputRef = useRef(null)

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24", 
    large: "w-32 h-32"
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WEBP)')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }

    setUploading(true)
    setError('')
    setUploadSuccess(false)

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)
      
      // Revoke the previous object URL if it exists
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }

      // Create FormData
      const formData = new FormData()
      formData.append('image', file)

      // Upload the file
      const result = await apiRequest(endpoints.uploadBusinessLogo, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with boundary
        headers: {},
        isFormData: true  // Flag to help apiRequest handle FormData properly
      })

      // Handle the wrapped response structure from apiRequest
      const logoUrl = result.data?.url
      
      if (logoUrl) {
        // Use the cache-busted URL from the server for immediate display
        setPreviewUrl(logoUrl)
        setUploadSuccess(true)
        
        // Call the parent callback with clean URL if available, otherwise use the display URL
        if (onLogoUpdate) {
          const cleanUrl = result.data?.clean_url || logoUrl
          onLogoUpdate(cleanUrl)
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000)
      } else {
        throw new Error('No URL returned from upload')
      }

    } catch (err) {
      
      // Try to extract a more meaningful error message
      let errorMessage = 'Upload failed. Please try again.'
      
      if (err.message && err.message !== '[object Object]') {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      setError(errorMessage)
      // Reset preview to current logo on error
      setPreviewUrl(currentLogoUrl)
    } finally {
      setUploading(false)
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = () => {
    setPreviewUrl(null)
    if (onLogoUpdate) {
      onLogoUpdate(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Logo Preview/Upload Area */}
      <div className="flex items-center space-x-4">
        <div 
          className={`${sizeClasses[size]} rounded-lg border-2 border-dashed border-slate-600 bg-slate-800 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-orange-500 transition-colors`}
          onClick={triggerFileInput}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          ) : previewUrl ? (
            <>
              <img 
                src={previewUrl} 
                alt="Business Logo" 
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Upload Logo</p>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex space-x-2">
            <Button
              type="button"
              onClick={triggerFileInput}
              disabled={uploading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {previewUrl ? 'Change Logo' : 'Upload Logo'}
                </>
              )}
            </Button>

            {previewUrl && !uploading && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveLogo}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>

          {/* Status Messages */}
          {uploadSuccess && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Logo updated successfully!
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Recommended: Square image, max 10MB. Supports JPEG, PNG, GIF, and WEBP.
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}