# Property Listing Creation - Setup Guide

## Quick Start

### 1. Install Required Dependency

The property listing creation feature requires `expo-image-picker` for image upload functionality.

```bash
cd apps/mobile
npm install expo-image-picker
```

### 2. Rebuild the App (if using development build)

```bash
# For iOS
npm run ios

# For Android
npm run android
```

### 3. Test the Feature

1. Open the app
2. Switch to Host mode (if you have host role)
3. Navigate to "Listings" tab
4. Tap "Create Listing" button
5. Follow the 7-step form

---

## Feature Overview

### Multi-Step Form Flow

1. **Property Type** - Select property type, room type, and bed type
2. **Property Details** - Enter name, description, and capacity
3. **Location** - Enter full address
4. **Amenities** - Select available amenities
5. **Pricing** - Set base price, fees, and policies
6. **Photos** - Upload property images
7. **Review & Publish** - Review and submit

### Key Components Created

#### Reusable Molecules
- `StepIndicator` - Progress indicator for multi-step forms
- `FormSection` - Reusable form section wrapper
- `SelectionCard` - Card for selecting options
- `AmenityChip` - Chip for selecting amenities
- `CounterInput` - Numeric input with +/- buttons
- `PropertyTypeSelector` - Property type selection
- `AmenitiesGrid` - Grid of amenity chips
- `ImagePickerCard` - Image upload and management

#### Main Screen
- `app/listing/create.tsx` - Complete 7-step listing creation form

---

## Backend Integration TODO

### Required API Endpoints

Once the backend is running, update the following in `app/listing/create.tsx`:

#### 1. Property Creation

Replace line ~452:
```typescript
// TODO: Call backend API to create property
// const response = await createProperty(formData);
```

With:
```typescript
const response = await propertiesAppControllerCreateProperty({
  data: {
    name: formData.name,
    description: formData.description,
    propertyType: formData.propertyType,
    roomType: formData.roomType,
    bedType: formData.bedType,
    accommodates: formData.accommodates,
    bedrooms: formData.bedrooms,
    beds: formData.beds,
    bathrooms: formData.bathrooms,
    address: formData.address,
    coordinates: formData.coordinates,
    location: {
      type: 'Point',
      coordinates: [formData.coordinates.longitude, formData.coordinates.latitude]
    },
    amenities: formData.amenities,
    features: {}, // TODO: Map amenities to features
    price: {
      basePrice: formData.basePrice,
      currency: formData.currency,
      currencySymbol: '$',
      pricePerNight: formData.basePrice,
      cleaningFee: formData.cleaningFee,
    },
    minimumNights: formData.minimumNights,
    maximumNights: formData.maximumNights,
    cancellationPolicy: formData.cancellationPolicy,
    images: [], // Will be uploaded separately
    availability: {
      availability30: 30,
      availability60: 60,
      availability90: 90,
      availability365: 365,
      hasAvailability: true,
    },
    instantBookable: formData.instantBookable,
    isBusinessTravelReady: false,
    requireGuestProfilePicture: false,
    requireGuestPhoneVerification: formData.requireGuestPhoneVerification,
  }
});
```

#### 2. Image Upload

Replace line ~424:
```typescript
// TODO: Upload to backend storage service
const newImage = result.assets[0].uri;
```

With:
```typescript
// Upload to backend storage
const formData = new FormData();
formData.append('file', {
  uri: result.assets[0].uri,
  type: 'image/jpeg',
  name: 'property-image.jpg',
} as any);

const uploadResponse = await storageAppControllerUploadFile({
  data: formData,
  params: { category: 'PROPERTY_IMAGES' }
});

const newImage = uploadResponse.data.url;
```

#### 3. Generate API Client

Run the API generation command to get the latest property endpoints:

```bash
cd apps/mobile
npm run generate-api
```

---

## Testing Checklist

### Functionality
- [ ] Navigate through all 7 steps
- [ ] Back button works correctly
- [ ] Validation prevents advancing with incomplete data
- [ ] Image picker opens correctly
- [ ] Images display in grid
- [ ] Image removal works
- [ ] Form submission shows loading state
- [ ] Success dialog appears after submission

### Visual
- [ ] Step indicator updates correctly
- [ ] All text is readable
- [ ] Icons display properly
- [ ] Colors match theme
- [ ] Dark mode works correctly
- [ ] Spacing is consistent

### Edge Cases
- [ ] Maximum values don't break UI
- [ ] Long text doesn't overflow
- [ ] Multiple rapid taps don't cause issues
- [ ] App doesn't crash on image picker cancel

---

## Troubleshooting

### Issue: Image picker doesn't open

**Solution:** Make sure you've installed `expo-image-picker` and rebuilt the app:
```bash
npm install expo-image-picker
npm run ios  # or npm run android
```

### Issue: "Permissions required" error

**Solution:** Request camera roll permissions before opening picker. Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos to upload property images."
        }
      ]
    ]
  }
}
```

### Issue: TypeScript errors for image picker

**Solution:** Make sure TypeScript types are available:
```bash
npm install --save-dev @types/expo-image-picker
```

---

## Next Steps

1. **Install dependency** - `expo-image-picker`
2. **Test the form** - Navigate through all steps
3. **Backend integration** - Connect to real API
4. **Add validation** - Enhanced validation rules
5. **Implement drafts** - Save incomplete listings

---

## Related Documentation

- Main Implementation Summary: `/PHASE_4_LISTING_CREATION_SUMMARY.md`
- Guest-to-Host Study: `/GUEST_TO_HOST_IMPLEMENTATION_STUDY.md`
- Backend Property DTO: `/apps/backend/src/modules/properties/dto/create-property.dto.ts`
- Mobile CLAUDE.md: `/apps/mobile/CLAUDE.md`

---

**Last Updated:** October 14, 2025
