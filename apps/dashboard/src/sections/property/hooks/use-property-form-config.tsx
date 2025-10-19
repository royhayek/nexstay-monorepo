import { useMemo } from 'react';

import type { DynamicFormSection } from 'src/components/dynamic-form/types';

import { useCatalogOptions } from 'src/contexts/app';

// ----------------------------------------------------------------------

/**
 * Hook that provides property form configuration with dynamic catalog options
 * This replaces the static property-form-config.ts with dynamic catalog-driven options
 */
export function usePropertyFormConfig(): DynamicFormSection[] {
  const propertyTypes = useCatalogOptions('PropertyType');
  const roomTypes = useCatalogOptions('RoomType');
  const bedTypes = useCatalogOptions('BedType');
  const cancellationPolicies = useCatalogOptions('CancellationPolicy');
  const amenities = useCatalogOptions('Amenity');

  return useMemo(
    () => [
      {
        id: 'basic-info',
        title: 'Basic Information',
        gridContainer: {
          spacing: 3,
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
          },
        },
        fields: [
          {
            id: 'name',
            name: 'name',
            type: 'text',
            label: 'Property Name',
            required: false,
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'propertyType',
            name: 'propertyType',
            type: 'select',
            label: 'Property Type',
            required: false,
            options: propertyTypes,
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'roomType',
            name: 'roomType',
            type: 'select',
            label: 'Room Type',
            required: false,
            options: roomTypes,
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'bedType',
            name: 'bedType',
            type: 'select',
            label: 'Bed Type',
            required: false,
            options: bedTypes,
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'summary',
            name: 'summary',
            type: 'text',
            label: 'Summary',
            multiline: true,
            rows: 2,
            gridSize: { xs: 12 },
          },
          {
            id: 'description',
            name: 'description',
            type: 'text',
            label: 'Description',
            required: false,
            multiline: true,
            rows: 4,
            gridSize: { xs: 12 },
          },
        ],
      },
      {
        id: 'property-details',
        title: 'Property Details',
        gridContainer: {
          spacing: 3,
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
          },
        },
        fields: [
          {
            id: 'accommodates',
            name: 'accommodates',
            type: 'number',
            label: 'Guests',
            required: false,
            gridSize: { xs: 6, sm: 3 },
          },
          {
            id: 'bedrooms',
            name: 'bedrooms',
            type: 'number',
            label: 'Bedrooms',
            required: false,
            gridSize: { xs: 6, sm: 3 },
          },
          {
            id: 'beds',
            name: 'beds',
            type: 'number',
            label: 'Beds',
            required: false,
            gridSize: { xs: 6, sm: 3 },
          },
          {
            id: 'bathrooms',
            name: 'bathrooms',
            type: 'number',
            label: 'Bathrooms',
            required: false,
            gridSize: { xs: 6, sm: 3 },
          },
        ],
      },
      {
        id: 'pricing',
        title: 'Pricing',
        gridContainer: {
          spacing: 3,
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
          },
        },
        fields: [
          {
            id: 'priceBasePrice',
            name: 'price.basePrice',
            type: 'number',
            label: 'Base Price',
            required: false,
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'pricePricePerNight',
            name: 'price.pricePerNight',
            type: 'number',
            label: 'Price per Night',
            required: false,
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'priceCurrency',
            name: 'price.currency',
            type: 'text',
            label: 'Currency',
            required: false,
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'priceCurrencySymbol',
            name: 'price.currencySymbol',
            type: 'text',
            label: 'Currency Symbol',
            required: false,
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'priceWeeklyDiscount',
            name: 'price.weeklyDiscount',
            type: 'number',
            label: 'Weekly Discount (%)',
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'priceMonthlyDiscount',
            name: 'price.monthlyDiscount',
            type: 'number',
            label: 'Monthly Discount (%)',
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'priceCleaningFee',
            name: 'price.cleaningFee',
            type: 'number',
            label: 'Cleaning Fee',
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'priceSecurityDeposit',
            name: 'price.securityDeposit',
            type: 'number',
            label: 'Security Deposit',
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
          {
            id: 'priceExtraPeopleFee',
            name: 'price.extraPeopleFee',
            type: 'number',
            label: 'Extra People Fee',
            gridSize: { xs: 12, sm: 6, md: 4, lg: 3 },
          },
        ],
      },
      {
        id: 'booking-rules',
        title: 'Booking Rules',
        gridContainer: {
          spacing: 3,
        },
        fields: [
          {
            id: 'minimumNights',
            name: 'minimumNights',
            type: 'number',
            label: 'Minimum Nights',
            required: false,
          },
          {
            id: 'maximumNights',
            name: 'maximumNights',
            type: 'number',
            label: 'Maximum Nights',
            required: false,
          },
          {
            id: 'cancellationPolicy',
            name: 'cancellationPolicy',
            type: 'select',
            label: 'Cancellation Policy',
            required: false,
            options: cancellationPolicies,
          },
        ],
      },
      {
        id: 'amenities',
        title: 'Amenities',
        fields: [
          {
            id: 'amenities',
            name: 'amenities',
            type: 'multicheckbox',
            label: 'Select Amenities',
            options: amenities,
          },
        ],
      },
    ],
    [propertyTypes, roomTypes, bedTypes, cancellationPolicies, amenities]
  );
}
