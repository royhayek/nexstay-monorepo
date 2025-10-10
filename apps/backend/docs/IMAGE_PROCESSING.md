# Image Processing Guide

## Overview
The Airbnb clone backend includes intelligent image processing using Sharp library to automatically optimize and generate multiple variants of uploaded images for better performance and user experience.

## Features

### Automatic Image Optimization
- **High-quality compression** using Sharp's advanced algorithms
- **Progressive JPEG** for faster loading perception
- **WebP format** with JPEG fallback for maximum compatibility
- **Metadata stripping** for privacy and smaller file sizes
- **Smart cropping** with center focus for consistent aspect ratios

### Multi-Size Variants

#### Profile Images
Perfect for user avatars across different UI components:

| Variant | Size | Quality | Format | Use Case |
|---------|------|---------|--------|----------|
| Thumbnail | 64x64px | 85% | WebP | User list, comments, small avatars |
| Small | 150x150px | 90% | WebP | Profile cards, navigation |
| Medium | 300x300px | 92% | WebP | Profile pages, detailed views |
| Original | Optimized | 95% | WebP | Full-size viewing |

#### Property Images  
Optimized for property listings with various display contexts:

| Variant | Size | Quality | Format | Use Case |
|---------|------|---------|--------|----------|
| Thumbnail | 320x240px | 80% | WebP | Property grid, search results |
| Small | 640x480px | 85% | WebP | Property cards, mobile |
| Medium | 1024x768px | 90% | WebP/JPEG | Property detail pages |
| Large | 1920x1080px | 92% | WebP | Full-screen galleries, desktop |
| Original | Optimized | 96% | WebP | Maximum quality viewing |

### Compression Performance
Typical compression results:
- **Profile Images**: 60-80% size reduction while maintaining visual quality
- **Property Images**: 70-85% size reduction with progressive loading
- **WebP Benefits**: Additional 25-30% savings over JPEG
- **Original Preservation**: High-quality original always maintained

## Configuration

### Environment Variables
```bash
# Enable/disable image processing
ENABLE_IMAGE_PROCESSING=true

# File size limits (processed images respect these limits)
MAX_PROFILE_IMAGE_SIZE=5242880   # 5MB
MAX_PROPERTY_IMAGE_SIZE=10485760 # 10MB
```

### Runtime Configuration
Image processing can be disabled per request:
```typescript
// Disable processing for specific upload
await s3Service.uploadFile(buffer, filename, contentType, category, userId, false);
```

## API Response Format

### Processed Image Response
```json
{
  "success": true,
  "data": {
    "key": "profile-images/user123/2024-01-10/uuid-avatar_original.webp",
    "url": "https://bucket.s3.region.amazonaws.com/profile-images/user123/2024-01-10/uuid-avatar_original.webp",
    "bucket": "airbnb-clone-uploads",
    "size": 45678,
    "contentType": "image/webp",
    "category": "profile-images",
    "isProcessed": true,
    "variants": [
      {
        "key": "profile-images/user123/2024-01-10/uuid-avatar_thumb.webp",
        "url": "https://bucket.s3.region.amazonaws.com/profile-images/user123/2024-01-10/uuid-avatar_thumb.webp",
        "size": "thumbnail",
        "width": 64,
        "height": 64,
        "contentType": "image/webp",
        "fileSize": 2048
      },
      {
        "key": "profile-images/user123/2024-01-10/uuid-avatar_sm.webp",
        "url": "https://bucket.s3.region.amazonaws.com/profile-images/user123/2024-01-10/uuid-avatar_sm.webp",
        "size": "small", 
        "width": 150,
        "height": 150,
        "contentType": "image/webp",
        "fileSize": 4096
      }
    ]
  }
}
```

## Frontend Usage Examples

### Responsive Image Display
```html
<!-- Profile avatar with fallbacks -->
<picture>
  <source 
    srcset="
      {{data.variants.thumbnail.url}} 64w,
      {{data.variants.small.url}} 150w,
      {{data.variants.medium.url}} 300w
    "
    type="image/webp">
  <img 
    src="{{data.variants.medium.url}}" 
    alt="User avatar"
    sizes="(max-width: 768px) 64px, 150px">
</picture>

<!-- Property image gallery -->
<picture>
  <source 
    srcset="
      {{variant.thumbnail.url}} 320w,
      {{variant.small.url}} 640w,
      {{variant.medium.url}} 1024w,
      {{variant.large.url}} 1920w
    "
    type="image/webp">
  <img 
    src="{{variant.medium.url}}" 
    alt="Property image"
    sizes="(max-width: 640px) 320px, (max-width: 1024px) 640px, 1024px"
    loading="lazy">
</picture>
```

### React/Next.js Usage
```tsx
interface ImageVariant {
  url: string;
  width: number;
  height: number;
  size: string;
}

interface ProcessedImage {
  url: string;
  variants: ImageVariant[];
  isProcessed: boolean;
}

const OptimizedImage: React.FC<{ image: ProcessedImage; alt: string }> = ({ 
  image, 
  alt 
}) => {
  if (!image.isProcessed) {
    return <img src={image.url} alt={alt} />;
  }

  const webpSources = image.variants
    .map(v => `${v.url} ${v.width}w`)
    .join(', ');

  return (
    <picture>
      <source srcSet={webpSources} type="image/webp" />
      <img 
        src={image.variants.find(v => v.size === 'medium')?.url || image.url}
        alt={alt}
        loading="lazy"
      />
    </picture>
  );
};
```

## Performance Benefits

### Loading Speed
- **Lazy loading support** with appropriate image sizes
- **Progressive rendering** for better perceived performance  
- **Bandwidth optimization** with format selection
- **CDN-ready** S3 URLs for global distribution

### User Experience
- **Consistent aspect ratios** prevent layout shifts
- **Quality preservation** maintains visual appeal
- **Mobile optimization** with appropriate sizes
- **Browser compatibility** with fallback formats

### SEO Benefits
- **Faster page loads** improve Core Web Vitals
- **Proper image sizing** reduces LCP (Largest Contentful Paint)
- **WebP adoption** for modern search engine preferences

## Monitoring & Debugging

### Compression Statistics
The service logs compression statistics for each processed image:

```
Image processing stats for profile.jpg: 
Original: 2.5 MB, Compressed: 456 KB, Savings: 81.8%, Variants: 4
```

### Error Handling
- **Graceful fallback** to original upload if processing fails
- **Detailed error logging** for debugging
- **Retry mechanism** for temporary failures

### Health Checks
```bash
# Test image processing endpoint
curl -X POST /api/storage/upload/profile-image \
  -H "Authorization: Bearer $JWT" \
  -F "file=@test-image.jpg" \
  -v
```

## Best Practices

### Upload Guidelines
1. **Upload high-quality originals** - compression is handled automatically
2. **Use standard formats** - JPEG, PNG, WebP are supported
3. **Avoid pre-compressed images** - let the service optimize
4. **Check file size limits** - respect configured maximums

### Frontend Implementation  
1. **Use responsive images** with appropriate srcsets
2. **Implement lazy loading** for better performance
3. **Provide fallbacks** for older browsers
4. **Cache appropriately** with proper HTTP headers

### Performance Optimization
1. **Preload critical images** above the fold
2. **Use appropriate sizes** for different breakpoints
3. **Implement progressive enhancement** with WebP
4. **Monitor Core Web Vitals** for image impact

## Troubleshooting

### Common Issues

**Image processing disabled unexpectedly**
- Check `ENABLE_IMAGE_PROCESSING` environment variable
- Verify Sharp installation: `npm list sharp`
- Review server logs for processing errors

**Poor compression results**
- Ensure high-quality source images
- Check if input format is supported
- Verify compression settings in ImageProcessingService

**Missing variants in response**
- Check for processing errors in logs
- Verify S3 upload permissions for all variants
- Test with different image formats

### Debug Mode
Enable detailed logging by setting log level to DEBUG:
```bash
LOG_LEVEL=debug npm run start:dev
```

---
**Last Updated**: 2024-01-10  
**Sharp Version**: Latest  
**Supported Formats**: JPEG, PNG, WebP, TIFF, GIF (converted to static)