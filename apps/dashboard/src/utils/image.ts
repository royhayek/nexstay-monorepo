import type { PropertyImageResponseDto } from 'src/api/models/admin/propertyImageResponseDto';

export function getOptimalImageUrl(image: PropertyImageResponseDto | any, maxWidth?: number): string {
  if (!image) return '';
  
  if (!image.variants || !Array.isArray(image.variants)) {
    if (maxWidth && maxWidth <= 320 && image.thumbnail_url) return image.thumbnail_url;
    if (maxWidth && maxWidth <= 1024 && image.medium_url) return image.medium_url;
    return image.large_url || image.url || image.thumbnail_url || '';
  }
  
  if (maxWidth && maxWidth <= 320) {
    return image.variants.find((v: any) => v.size === 'thumbnail')?.url || image.thumbnail_url;
  }
  if (maxWidth && maxWidth <= 1024) {
    return image.variants.find((v: any) => v.size === 'medium')?.url || image.medium_url;
  }
  return image.variants.find((v: any) => v.size === 'large')?.url || image.large_url || image.url;
}