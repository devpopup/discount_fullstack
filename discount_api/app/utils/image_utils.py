# app/utils/image_utils.py
"""
Image processing utilities for handling uploads and compression.
This is a simple fallback implementation. For production, consider using Pillow for better image processing.
"""

import io
from typing import Tuple, Dict, Any, Optional

def validate_image_file(image_data: bytes) -> Tuple[bool, str]:
    """
    Validate that the provided bytes represent a valid image file.
    
    Args:
        image_data: Raw image file bytes
        
    Returns:
        Tuple of (is_valid, message)
    """
    try:
        # Check for common image file signatures
        if image_data[:2] == b'\xff\xd8':  # JPEG
            return True, "Valid JPEG image"
        elif image_data[:8] == b'\x89PNG\r\n\x1a\n':  # PNG
            return True, "Valid PNG image"
        elif image_data[:6] in [b'GIF87a', b'GIF89a']:  # GIF
            return True, "Valid GIF image"
        elif image_data[:4] == b'RIFF' and image_data[8:12] == b'WEBP':  # WEBP
            return True, "Valid WEBP image"
        else:
            return False, "Unknown or invalid image format"
    except Exception as e:
        return False, f"Error validating image: {str(e)}"

def get_image_info(image_data: bytes) -> Dict[str, Any]:
    """
    Get basic information about an image.
    
    Args:
        image_data: Raw image file bytes
        
    Returns:
        Dictionary containing image information
    """
    info = {
        "size": len(image_data),
        "format": "unknown",
        "width": 0,  # Default to 0 instead of None
        "height": 0  # Default to 0 instead of None
    }
    
    try:
        # Detect format based on file signature
        if image_data[:2] == b'\xff\xd8':
            info["format"] = "JPEG"
        elif image_data[:8] == b'\x89PNG\r\n\x1a\n':
            info["format"] = "PNG"
        elif image_data[:6] in [b'GIF87a', b'GIF89a']:
            info["format"] = "GIF"
        elif image_data[:4] == b'RIFF' and image_data[8:12] == b'WEBP':
            info["format"] = "WEBP"
    
    except Exception as e:
        print(f"Error getting image info: {e}")
    
    return info

def compress_image(
    image_data: bytes, 
    max_size_bytes: int = 2 * 1024 * 1024,  # 2MB default
    quality: int = 85,
    max_dimension: Optional[int] = None
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Compress image data. This is a simple fallback implementation.
    For production, use Pillow for actual image processing.
    
    Args:
        image_data: Raw image file bytes
        max_size_bytes: Maximum size in bytes
        quality: JPEG quality (not used in fallback)
        max_dimension: Maximum width/height (not used in fallback)
        
    Returns:
        Tuple of (compressed_data, compression_info)
    """
    # Fallback: just return original data with info
    # In production, you would use Pillow to actually resize/compress
    
    original_size = len(image_data)
    
    # If image is already smaller than max size, return as-is
    if original_size <= max_size_bytes:
        return image_data, {
            "original_size": original_size,
            "compressed_size": original_size,
            "compression_ratio": 0,
            "message": "No compression needed"
        }
    
    # Fallback: return original (in production, would compress here)
    return image_data, {
        "original_size": original_size,
        "compressed_size": original_size,
        "compression_ratio": 0,
        "message": "Compression not available (install Pillow for full image processing)"
    }