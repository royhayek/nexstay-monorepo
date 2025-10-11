'use client';

import type { UpdatePropertyDto, PropertyResponseDto } from 'src/api/models/admin';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { getOptimalImageUrl } from 'src/utils/image';

import {
  usePropertiesAdminControllerUpdateProperty,
  usePropertiesAdminControllerDeletePropertyImage,
  usePropertiesAdminControllerUploadPropertyImages,
} from 'src/api/queries/admin/properties-management/properties-management';

import { toast } from 'src/components/snackbar';

import { PropertyLayout } from './property-layout';
import { PropertyDetails } from './tabs/property-details';
import { PropertyGeneral } from './tabs/property-general';
import { PropertyPricing } from './tabs/property-pricing';
import { PropertyLocation } from './tabs/property-location';
import { PropertySettings } from './tabs/property-settings';
import { PropertyAmenities } from './tabs/property-amenities';

// ----------------------------------------------------------------------

export type UpdatePropertySchemaType = zod.infer<typeof UpdatePropertySchema>;

export const UpdatePropertySchema = zod.object({
  // Basic Property Info - matching UpdatePropertyDto
  name: zod.string().min(1, { message: 'Property name is required!' }).max(50).optional(),
  summary: zod.string().max(1000).optional(),
  space: zod.string().max(1000).optional(),
  description: zod.string().max(1000).optional(),
  neighborhoodOverview: zod.string().max(1000).optional(),
  notes: zod.string().max(1000).optional(),
  transit: zod.string().max(1000).optional(),
  access: zod.string().max(1000).optional(),
  interaction: zod.string().max(1000).optional(),
  houseRules: zod.string().max(1000).optional(),
  propertyType: zod
    .enum([
      'Apartment',
      'House',
      'Townhouse',
      'Condominium',
      'Villa',
      'Loft',
      'Cabin',
      'Cottage',
      'Bungalow',
      'Castle',
      'Treehouse',
      'Boat',
      'Camper/RV',
      'Tent',
      'Hotel',
      'Hostel',
      'Bed & Breakfast',
      'Boutique hotel',
      'Guesthouse',
      'Guest suite',
      'Serviced apartment',
      'Other',
    ] as const)
    .optional(),
  roomType: zod
    .enum(['Entire home/apt', 'Private room', 'Shared room', 'Hotel room'] as const)
    .optional(),
  bedType: zod.enum(['Real Bed', 'Pull-out Sofa', 'Futon', 'Couch', 'Airbed'] as const).optional(),

  // Property Details
  accommodates: zod.number().min(1, { message: 'Must accommodate at least 1 guest!' }).optional(),
  bedrooms: zod.number().min(0, { message: 'Bedrooms cannot be negative!' }).optional(),
  beds: zod.number().min(1, { message: 'Must have at least 1 bed!' }).optional(),
  bathrooms: zod.number().min(1, { message: 'Must have at least 1 bathroom!' }).optional(),

  // Booking Rules
  minimumNights: zod.number().min(1, { message: 'Minimum nights must be at least 1!' }).optional(),
  maximumNights: zod.number().min(1, { message: 'Maximum nights must be at least 1!' }).optional(),
  cancellationPolicy: zod
    .enum([
      'flexible',
      'moderate',
      'strict',
      'strict_14_with_grace_period',
      'super_strict_30',
      'super_strict_60',
    ] as const)
    .optional(),

  // Pricing - matching CreatePriceInfoDto
  price: zod
    .object({
      basePrice: zod.number().min(0).optional(),
      currency: zod.string().min(3, { message: 'Currency code must be 3 characters!' }).max(3),
      currencySymbol: zod.string().max(5, { message: 'Currency symbol too long!' }),
      pricePerNight: zod.number().min(0).optional(),
      weeklyDiscount: zod.number().min(0).max(100).optional(),
      monthlyDiscount: zod.number().min(0).max(100).optional(),
      cleaningFee: zod.number().min(0).optional(),
      securityDeposit: zod.number().min(0).optional(),
      extraPeopleFee: zod.number().min(0).optional(),
    })
    .optional(),

  // Address - matching CreateAddressDto
  address: zod
    .object({
      street: zod.string().min(1, { message: 'Street is required!' }).max(50),
      city: zod.string().min(1, { message: 'City is required!' }).max(50),
      state: zod.string().min(1, { message: 'State is required!' }).max(50),
      country: zod.string().min(1, { message: 'Country is required!' }).max(50),
      countryCode: zod.string().min(2, { message: 'Country code is required!' }).max(2),
      postalCode: zod.string().min(1, { message: 'Postal code is required!' }),
      neighborhood: zod.string().optional(),
      suburb: zod.string().optional(),
      governmentArea: zod.string().optional(),
      market: zod.string().optional(),
      smartLocation: zod.string().optional(),
    })
    .optional(),

  // Coordinates - matching CreateCoordinatesDto
  coordinates: zod
    .object({
      latitude: zod.number().min(-90).max(90, { message: 'Invalid latitude!' }).optional(),
      longitude: zod.number().min(-180).max(180, { message: 'Invalid longitude!' }).optional(),
    })
    .optional(),

  // Amenities - optional array in API (max 50 items)
  amenities: zod.array(zod.string()).max(50).optional(),

  // Features - matching CreatePropertyFeaturesDto
  features: zod
    .object({
      smokeDetector: zod.boolean().optional(),
      carbonMonoxideDetector: zod.boolean().optional(),
      fireExtinguisher: zod.boolean().optional(),
      firstAidKit: zod.boolean().optional(),
      safetyCard: zod.boolean().optional(),
      kitchen: zod.boolean().optional(),
      kitchenette: zod.boolean().optional(),
      refrigerator: zod.boolean().optional(),
      microwave: zod.boolean().optional(),
      dishwasher: zod.boolean().optional(),
      coffeeMaker: zod.boolean().optional(),
      wifi: zod.boolean().optional(),
      internet: zod.boolean().optional(),
      cableTv: zod.boolean().optional(),
      airConditioning: zod.boolean().optional(),
      heating: zod.boolean().optional(),
      hotWater: zod.boolean().optional(),
      balcony: zod.boolean().optional(),
      patio: zod.boolean().optional(),
      garden: zod.boolean().optional(),
      pool: zod.boolean().optional(),
      hotTub: zod.boolean().optional(),
      freeParking: zod.boolean().optional(),
      paidParking: zod.boolean().optional(),
      streetParking: zod.boolean().optional(),
      familyKidFriendly: zod.boolean().optional(),
      crib: zod.boolean().optional(),
      highChair: zod.boolean().optional(),
      wheelchairAccessible: zod.boolean().optional(),
      elevatorInBuilding: zod.boolean().optional(),
      laptopFriendlyWorkspace: zod.boolean().optional(),
      suitableForEvents: zod.boolean().optional(),
      petsAllowed: zod.boolean().optional(),
      petsLiveOnProperty: zod.boolean().optional(),
      dog: zod.boolean().optional(),
      cat: zod.boolean().optional(),
      smokingAllowed: zod.boolean().optional(),
    })
    .optional(),

  // Availability - matching CreateAvailabilityInfoDto
  availability: zod
    .object({
      availability30: zod.number().min(0).max(30),
      availability60: zod.number().min(0).max(60),
      availability90: zod.number().min(0).max(90),
      availability365: zod.number().min(0).max(365),
      hasAvailability: zod.boolean(),
    })
    .optional(),

  // Boolean Settings - all optional in UpdatePropertyDto
  instantBookable: zod.boolean().optional(),
  isBusinessTravelReady: zod.boolean().optional(),
  requireGuestProfilePicture: zod.boolean().optional(),
  requireGuestPhoneVerification: zod.boolean().optional(),

  // Images - array can contain Files (for upload) or URL strings
  images: zod.array(zod.union([zod.instanceof(File), zod.string().url()])).optional(),
});

type Props = {
  currentProperty?: PropertyResponseDto;
};

export function PropertyFormProvider({ currentProperty }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const { mutate: updateProperty } = usePropertiesAdminControllerUpdateProperty();
  const { mutateAsync: uploadImages } = usePropertiesAdminControllerUploadPropertyImages();
  const { mutateAsync: deleteImage } = usePropertiesAdminControllerDeletePropertyImage();

  const defaultValues: UpdatePropertySchemaType = useMemo(
    () => ({
      name: currentProperty?.name || '',
      summary: currentProperty?.summary || '',
      space: currentProperty?.space || '',
      description: currentProperty?.description || '',
      neighborhoodOverview: currentProperty?.neighborhoodOverview || '',
      notes: currentProperty?.notes || '',
      transit: currentProperty?.transit || '',
      access: currentProperty?.access || '',
      interaction: currentProperty?.interaction || '',
      houseRules: currentProperty?.houseRules || '',
      propertyType: currentProperty?.propertyType || 'Apartment',
      roomType: currentProperty?.roomType || 'Entire home/apt',
      bedType: currentProperty?.bedType || 'Real Bed',
      accommodates: currentProperty?.accommodates || 1,
      bedrooms: currentProperty?.bedrooms || 1,
      beds: currentProperty?.beds || 1,
      bathrooms: currentProperty?.bathrooms || 1,
      minimumNights: currentProperty?.minimumNights || 1,
      maximumNights: currentProperty?.maximumNights || 30,
      cancellationPolicy: currentProperty?.cancellationPolicy || 'flexible',
      price: {
        basePrice: currentProperty?.price?.basePrice || 0,
        currency: currentProperty?.price?.currency || 'USD',
        currencySymbol: currentProperty?.price?.currencySymbol || '$',
        pricePerNight: currentProperty?.price?.pricePerNight || 0,
        weeklyDiscount: currentProperty?.price?.weeklyDiscount || 0,
        monthlyDiscount: currentProperty?.price?.monthlyDiscount || 0,
        cleaningFee: currentProperty?.price?.cleaningFee || 0,
        securityDeposit: currentProperty?.price?.securityDeposit || 0,
        extraPeopleFee: currentProperty?.price?.extraPeopleFee || 0,
      },
      address: {
        street: currentProperty?.address?.street || '',
        city: currentProperty?.address?.city || '',
        state:
          (currentProperty?.address as any)?.state ||
          (currentProperty?.address as any)?.governorate ||
          '',
        country: currentProperty?.address?.country || '',
        countryCode: currentProperty?.address?.countryCode || '',
        postalCode: currentProperty?.address?.postalCode || '',
        neighborhood: currentProperty?.address?.neighborhood,
        suburb: (currentProperty?.address as any)?.suburb,
        governmentArea: (currentProperty?.address as any)?.governmentArea,
        market: (currentProperty?.address as any)?.market,
        smartLocation: (currentProperty?.address as any)?.smartLocation,
      },
      coordinates: {
        latitude: currentProperty?.coordinates?.latitude,
        longitude: currentProperty?.coordinates?.longitude,
      },
      amenities: currentProperty?.amenities || [],
      features: {
        smokeDetector: currentProperty?.features?.smokeDetector,
        carbonMonoxideDetector: currentProperty?.features?.carbonMonoxideDetector,
        fireExtinguisher: currentProperty?.features?.fireExtinguisher,
        firstAidKit: currentProperty?.features?.firstAidKit,
        safetyCard: currentProperty?.features?.safetyCard,
        kitchen: currentProperty?.features?.kitchen,
        kitchenette: currentProperty?.features?.kitchenette,
        refrigerator: currentProperty?.features?.refrigerator,
        microwave: currentProperty?.features?.microwave,
        dishwasher: (currentProperty?.features as any)?.dishwasher,
        coffeeMaker: (currentProperty?.features as any)?.coffeeMaker,
        wifi: currentProperty?.features?.wifi,
        internet: (currentProperty?.features as any)?.internet,
        cableTv: (currentProperty?.features as any)?.cableTv,
        airConditioning: (currentProperty?.features as any)?.airConditioning,
        heating: (currentProperty?.features as any)?.heating,
        hotWater: (currentProperty?.features as any)?.hotWater,
        balcony: (currentProperty?.features as any)?.balcony,
        patio: (currentProperty?.features as any)?.patio,
        garden: (currentProperty?.features as any)?.garden,
        pool: currentProperty?.features?.pool,
        hotTub: (currentProperty?.features as any)?.hotTub,
        freeParking: (currentProperty?.features as any)?.freeParking,
        paidParking: (currentProperty?.features as any)?.paidParking,
        streetParking: (currentProperty?.features as any)?.streetParking,
        familyKidFriendly: (currentProperty?.features as any)?.familyKidFriendly,
        crib: (currentProperty?.features as any)?.crib,
        highChair: (currentProperty?.features as any)?.highChair,
        wheelchairAccessible: (currentProperty?.features as any)?.wheelchairAccessible,
        elevatorInBuilding: (currentProperty?.features as any)?.elevatorInBuilding,
        laptopFriendlyWorkspace: (currentProperty?.features as any)?.laptopFriendlyWorkspace,
        suitableForEvents: (currentProperty?.features as any)?.suitableForEvents,
        petsAllowed: (currentProperty?.features as any)?.petsAllowed,
        petsLiveOnProperty: (currentProperty?.features as any)?.petsLiveOnProperty,
        dog: (currentProperty?.features as any)?.dog,
        cat: (currentProperty?.features as any)?.cat,
        smokingAllowed: (currentProperty?.features as any)?.smokingAllowed,
      },
      availability: {
        availability30: currentProperty?.availability?.availability30 || 0,
        availability60: currentProperty?.availability?.availability60 || 0,
        availability90: currentProperty?.availability?.availability90 || 0,
        availability365: currentProperty?.availability?.availability365 || 0,
        hasAvailability: currentProperty?.availability?.hasAvailability || false,
      },
      instantBookable: currentProperty?.instantBookable,
      isBusinessTravelReady: currentProperty?.isBusinessTravelReady,
      requireGuestProfilePicture: currentProperty?.requireGuestProfilePicture,
      requireGuestPhoneVerification: currentProperty?.requireGuestPhoneVerification,
      // Use optimal image URLs for display in the upload field for better performance
      images: currentProperty?.images?.map((img) => getOptimalImageUrl(img, 320)) || [],
    }),
    [currentProperty]
  );

  const methods = useForm<UpdatePropertySchemaType>({
    mode: 'all',
    resolver: zodResolver(UpdatePropertySchema),
    defaultValues,
  });

  const {
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = useCallback(
    async (data: UpdatePropertySchemaType) => {
      try {
        if (!currentProperty) return;

        // Separate files from other form data
        const { images, ...propertyData } = data;

        // Filter only File objects from images array (new uploads)
        const filesToUpload = images?.filter((img): img is File => img instanceof File) || [];

        // Filter existing image URLs (already uploaded images)
        const existingImageUrls =
          images?.filter((img): img is string => typeof img === 'string') || [];

        let uploadedImageData: any[] = [];

        // Upload images first if there are any new files
        if (filesToUpload.length > 0) {
          try {
            const uploadResponse = await uploadImages({
              data: { images: filesToUpload },
            });

            console.log('[uploadResponse] Image upload response:', uploadResponse);

            // Convert uploaded images to CreatePropertyImageDto format for property update
            uploadedImageData = uploadResponse.data.files.map(
              (uploadedImage: any, index: number) => {
                // Extract variant URLs for quick access (3 variants: thumbnail, medium, large)
                const thumbnailVariant = uploadedImage.variants?.find(
                  (v: any) => v.size === 'thumbnail'
                );
                const mediumVariant = uploadedImage.variants?.find((v: any) => v.size === 'medium');
                const largeVariant = uploadedImage.variants?.find((v: any) => v.size === 'large');

                return {
                  url: uploadedImage.url, // Original/highest quality URL
                  key: uploadedImage.key, // S3 storage key for direct operations
                  thumbnail_url: thumbnailVariant?.url || uploadedImage.thumbnailUrl,
                  medium_url: mediumVariant?.url,
                  large_url: largeVariant?.url,
                  // Filter out etag property from variants to match API expectations
                  variants: uploadedImage.variants?.map((variant: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { etag, ...variantWithoutEtag } = variant;
                    return variantWithoutEtag;
                  }),
                  is_primary: index === 0, // First uploaded image is primary
                  sort_order: index,
                  contentType: uploadedImage.contentType,
                  fileSize: uploadedImage.fileSize,
                };
              }
            );
          } catch (uploadError) {
            console.error('Failed to upload images:', uploadError);
            toast.error('Failed to upload images. Please try again.');
            return;
          }
        }

        // Identify removed images that need to be deleted
        const currentImageUrls =
          currentProperty?.images?.map((img) => getOptimalImageUrl(img, 320)) || [];
        const removedImages =
          currentProperty?.images?.filter((img) => {
            const imgUrl = getOptimalImageUrl(img, 320);
            return !existingImageUrls.includes(imgUrl);
          }) || [];

        console.log('[DEBUG] Current images:', currentImageUrls);
        console.log('[DEBUG] Remaining images:', existingImageUrls);
        console.log('[DEBUG] Removed images to delete:', removedImages);

        // Delete removed images first
        if (removedImages.length > 0) {
          console.log('[DEBUG] Deleting removed images...');
          try {
            await Promise.all(
              removedImages.map((img) => {
                if (img.key) {
                  console.log(`[DEBUG] Deleting image with key: ${img.key}`);
                  return deleteImage({ params: { key: img.key } });
                }
                return Promise.resolve();
              })
            );
            console.log('[DEBUG] Successfully deleted removed images');
          } catch (deleteError) {
            console.error('Failed to delete some images:', deleteError);
            // Continue with the update even if some deletions fail
            toast.error('Some images could not be deleted, but the property will be updated.');
          }
        }

        // Combine existing images with newly uploaded ones
        // For existing images, we need to convert them back to the proper format
        const existingImagesData = existingImageUrls.map((url) => {
          // Find the original image object from currentProperty
          // Check both url and thumbnail_url since we're using thumbnails in the form
          const originalImage = currentProperty?.images?.find(
            (img) => img.url === url || img.thumbnailUrl === url
          );
          if (originalImage) {
            // Only include the image if it has a valid key (required by API)
            if (!originalImage.key) {
              console.warn('Skipping image without key:', originalImage.url);
              return null;
            }

            return {
              url: originalImage.url, // Always use the original/full URL for storage
              key: originalImage.key, // S3 storage key (required)
              thumbnail_url: originalImage.thumbnailUrl,
              medium_url: originalImage.mediumUrl, // Preserve medium variant
              large_url: originalImage.largeUrl, // Preserve large variant
              // Filter out etag property from variants to match API expectations
              variants: originalImage.variants?.map((variant: any) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { etag, ...variantWithoutEtag } = variant;
                return variantWithoutEtag;
              }),
              is_primary: originalImage.isPrimary,
              sort_order: originalImage.sortOrder,
              contentType: originalImage.contentType,
              fileSize: originalImage.fileSize,
            };
          }
          // Fallback if image not found in original data - skip images without keys
          console.warn('Skipping unknown image without key:', url);
          return null;
        });

        // Filter out null values and combine all images - new uploads first, then existing ones
        const validExistingImages = existingImagesData.filter(
          (img): img is NonNullable<typeof img> => img !== null
        );
        const allImages = [...uploadedImageData, ...validExistingImages];

        console.log('[DEBUG] Valid existing images:', validExistingImages.length);
        console.log('[DEBUG] Total images to send:', allImages.length);
        console.log(
          '[DEBUG] All images keys:',
          allImages.map((img) => ({ url: img.url, hasKey: !!img.key }))
        );

        // Prepare property data with uploaded images
        const finalPropertyData: UpdatePropertyDto = {
          ...propertyData,
          // Ensure coordinate values are numbers (not strings)
          address: propertyData.address,
          // Include all images (both new and existing)
          images: allImages.length > 0 ? allImages : undefined,
        };

        console.log(
          '[finalPropertyData] sending to API:',
          JSON.stringify(finalPropertyData, null, 2)
        );

        // Update property with all data including uploaded images
        updateProperty(
          { id: currentProperty._id, data: finalPropertyData },
          {
            onSuccess: () => {
              toast.success('Property updated successfully!');
              router.push(paths.dashboard.properties.list);
            },
            onError: (error) => {
              console.error('Failed to save property:', error);
              toast.error('Failed to update property');
            },
          }
        );
      } catch (error) {
        console.error('Form submission error:', error);
        toast.error('An error occurred while saving the property');
      }
    },
    [currentProperty, updateProperty, uploadImages, deleteImage, router]
  );

  const handleReset = useCallback(() => {
    reset(defaultValues);
  }, [reset, defaultValues]);

  // Reset form when currentProperty changes (for editing existing property)
  useEffect(() => {
    if (currentProperty) {
      reset(defaultValues);
    }
  }, [currentProperty, defaultValues, reset]);

  // Determine which tab component to render based on active tab
  const renderTabContent = () => {
    const tabProps = {
      currentProperty,
      methods,
      onSubmit,
      onReset: handleReset,
      isSubmitting,
    } as const;

    switch (activeTab) {
      case 'general':
        return <PropertyGeneral {...(tabProps as any)} />;
      case 'details':
        return <PropertyDetails {...(tabProps as any)} />;
      case 'pricing':
        return <PropertyPricing {...(tabProps as any)} />;
      case 'location':
        return <PropertyLocation {...(tabProps as any)} />;
      case 'amenities':
        return <PropertyAmenities {...(tabProps as any)} />;
      case 'settings':
        return <PropertySettings {...(tabProps as any)} />;
      default:
        return <PropertyGeneral {...(tabProps as any)} />;
    }
  };

  return (
    <PropertyLayout
      propertyId={currentProperty?._id}
      isNew={!currentProperty}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderTabContent()}
    </PropertyLayout>
  );
}
