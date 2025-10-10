import type { CreatePropertyDto } from 'src/api/models';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { usePropertiesControllerCreateV1 } from 'src/api/queries/properties/properties';
import {
  CreatePropertyDtoBedType,
  CreatePropertyDtoRoomType,
  CreatePropertyDtoPropertyType,
  CreatePropertyDtoCancellationPolicy,
} from 'src/api/models';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type CreatePropertySchemaType = zod.infer<typeof CreatePropertySchema>;

export const CreatePropertySchema = zod.object({
  // Basic Property Info
  name: zod.string().min(1, { message: 'Property name is required!' }),
  summary: zod.string().optional(),
  description: zod.string().min(1, { message: 'Description is required!' }),
  property_type: zod.enum(
    [
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
    ] as const,
    { message: 'Property type is required!' }
  ),
  room_type: zod.enum(['Entire home/apt', 'Private room', 'Shared room', 'Hotel room'] as const, {
    message: 'Room type is required!',
  }),
  bed_type: zod.enum(['Real Bed', 'Pull-out Sofa', 'Futon', 'Couch', 'Airbed'] as const, {
    message: 'Bed type is required!',
  }),

  // Property Details
  accommodates: zod.number().min(1, { message: 'Must accommodate at least 1 guest!' }),
  bedrooms: zod.number().min(0, { message: 'Bedrooms cannot be negative!' }),
  beds: zod.number().min(1, { message: 'Must have at least 1 bed!' }),
  bathrooms: zod.number().min(0, { message: 'Bathrooms cannot be negative!' }),

  // Booking Rules
  minimum_nights: zod.number().min(1, { message: 'Minimum nights must be at least 1!' }),
  maximum_nights: zod.number().min(1, { message: 'Maximum nights must be at least 1!' }),
  cancellation_policy: zod.enum(
    [
      'flexible',
      'moderate',
      'strict',
      'strict_14_with_grace_period',
      'super_strict_30',
      'super_strict_60',
    ] as const,
    {
      message: 'Cancellation policy is required!',
    }
  ),

  // Pricing
  price: zod.object({
    base_price: zod.number().min(1, { message: 'Base price is required!' }),
    currency: zod.string().min(1, { message: 'Currency is required!' }),
    currency_symbol: zod.string().min(1, { message: 'Currency symbol is required!' }),
    price_per_night: zod.number().min(1, { message: 'Price per night is required!' }),
    weekly_discount: zod.number().min(0).max(100).optional(),
    monthly_discount: zod.number().min(0).max(100).optional(),
    cleaning_fee: zod.number().min(0).optional(),
    security_deposit: zod.number().min(0).optional(),
    extra_people_fee: zod.number().min(0).optional(),
  }),

  // Address
  address: zod.object({
    street: zod.string().optional(),
    suburb: zod.string().optional(),
    government_area: zod.string().optional(),
    market: zod.string().optional(),
    country: zod.string().min(1, { message: 'Country is required!' }),
    country_code: zod.string().min(2, { message: 'Country code is required!' }),
    location: zod.object({
      type: zod.string().default('Point'),
      coordinates: zod
        .array(zod.number())
        .length(2, { message: 'Coordinates must be [longitude, latitude]!' }),
    }),
  }),

  // Coordinates
  coordinates: zod.object({
    latitude: zod.number().min(-90).max(90, { message: 'Invalid latitude!' }),
    longitude: zod.number().min(-180).max(180, { message: 'Invalid longitude!' }),
  }),

  // Amenities
  amenities: zod.array(zod.string()).default([]),

  // Host Info (simplified for form)
  host: zod.object({
    host_id: zod.string().min(1, { message: 'Host ID is required!' }),
    host_name: zod.string().min(1, { message: 'Host name is required!' }),
    host_since: zod.string().min(1, { message: 'Host since date is required!' }),
    host_location: zod.string().optional(),
    host_about: zod.string().optional(),
    host_response_time: zod.string().optional(),
    host_response_rate: zod.number().min(0).max(100).optional(),
    host_acceptance_rate: zod.number().min(0).max(100).optional(),
    host_is_superhost: zod.boolean().default(false),
    host_thumbnail_url: zod.string().optional(),
    host_picture_url: zod.string().optional(),
    host_listings_count: zod.number().min(0).default(0),
    host_total_listings_count: zod.number().min(0).default(0),
    host_verifications: zod.array(zod.string()).default([]),
    host_has_profile_pic: zod.boolean().default(false),
    host_identity_verified: zod.boolean().default(false),
  }),

  // Features
  features: zod
    .object({
      wifi: zod.boolean().default(false),
      kitchen: zod.boolean().default(false),
      air_conditioning: zod.boolean().default(false),
      heating: zod.boolean().default(false),
      hot_water: zod.boolean().default(false),
      free_parking: zod.boolean().default(false),
      pool: zod.boolean().default(false),
      pets_allowed: zod.boolean().default(false),
      smoking_allowed: zod.boolean().default(false),
      wheelchair_accessible: zod.boolean().default(false),
      family_kid_friendly: zod.boolean().default(false),
      elevator_in_building: zod.boolean().default(false),
      laptop_friendly_workspace: zod.boolean().default(false),
      suitable_for_events: zod.boolean().default(false),
    })
    .partial(),

  // Availability
  availability: zod.object({
    available_from: zod.string().optional(),
    available_to: zod.string().optional(),
    calendar_last_scraped: zod.string().optional(),
  }),

  // Boolean Settings
  instant_bookable: zod.boolean().default(false),
  is_business_travel_ready: zod.boolean().default(false),
  require_guest_profile_picture: zod.boolean().default(false),
  require_guest_phone_verification: zod.boolean().default(false),

  // Optional fields
  space: zod.string().optional(),
  neighborhood_overview: zod.string().optional(),
  notes: zod.string().optional(),
  transit: zod.string().optional(),
  access: zod.string().optional(),
  interaction: zod.string().optional(),
  house_rules: zod.string().optional(),
  images: zod
    .array(
      zod.object({
        url: zod.string().url({ message: 'Invalid image URL!' }),
        thumbnail_url: zod.string().url().optional(),
        medium_url: zod.string().url().optional(),
        picture_url: zod.string().url().optional(),
        xl_picture_url: zod.string().url().optional(),
      })
    )
    .optional(),
});

// ----------------------------------------------------------------------

const PROPERTY_TYPE_OPTIONS = Object.values(CreatePropertyDtoPropertyType).map((value) => ({
  label: value,
  value,
}));

const ROOM_TYPE_OPTIONS = Object.values(CreatePropertyDtoRoomType).map((value) => ({
  label: value,
  value,
}));

const BED_TYPE_OPTIONS = Object.values(CreatePropertyDtoBedType).map((value) => ({
  label: value,
  value,
}));

const CANCELLATION_POLICY_OPTIONS = Object.values(CreatePropertyDtoCancellationPolicy).map(
  (value) => ({
    label: value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  })
);

const COMMON_AMENITIES = [
  'WiFi',
  'Kitchen',
  'Air conditioning',
  'Heating',
  'Hot water',
  'Free parking',
  'Pool',
  'Gym',
  'TV',
  'Washer',
  'Dryer',
  'Iron',
  'Hair dryer',
  'Coffee maker',
  'Dishwasher',
  'Microwave',
  'Refrigerator',
  'Balcony',
  'Garden',
  'Hot tub',
];

// ----------------------------------------------------------------------

type Props = {
  currentProperty?: CreatePropertyDto;
};

export function PropertyNewEditForm({ currentProperty }: Props) {
  const router = useRouter();

  const { mutate: createProperty } = usePropertiesControllerCreateV1();

  const defaultValues: CreatePropertySchemaType = useMemo(
    () => ({
      name: currentProperty?.name || '',
      summary: currentProperty?.summary || '',
      description: currentProperty?.description || '',
      property_type: currentProperty?.property_type || 'Apartment',
      room_type: currentProperty?.room_type || 'Entire home/apt',
      bed_type: currentProperty?.bed_type || 'Real Bed',
      accommodates: currentProperty?.accommodates || 1,
      bedrooms: currentProperty?.bedrooms || 1,
      beds: currentProperty?.beds || 1,
      bathrooms: currentProperty?.bathrooms || 1,
      minimum_nights: currentProperty?.minimum_nights || 1,
      maximum_nights: currentProperty?.maximum_nights || 30,
      cancellation_policy: currentProperty?.cancellation_policy || 'flexible',
      price: {
        base_price: currentProperty?.price?.base_price || 0,
        currency: currentProperty?.price?.currency || 'USD',
        currency_symbol: currentProperty?.price?.currency_symbol || '$',
        price_per_night: currentProperty?.price?.price_per_night || 0,
        weekly_discount: currentProperty?.price?.weekly_discount || 0,
        monthly_discount: currentProperty?.price?.monthly_discount || 0,
        cleaning_fee: currentProperty?.price?.cleaning_fee || 0,
        security_deposit: currentProperty?.price?.security_deposit || 0,
        extra_people_fee: currentProperty?.price?.extra_people_fee || 0,
      },
      address: {
        street: currentProperty?.address?.street || '',
        suburb: currentProperty?.address?.suburb || '',
        government_area: currentProperty?.address?.government_area || '',
        market: currentProperty?.address?.market || '',
        country: currentProperty?.address?.country || '',
        country_code: currentProperty?.address?.country_code || '',
        location: {
          type: 'Point',
          coordinates: currentProperty?.address?.location?.coordinates || [0, 0],
        },
      },
      coordinates: {
        latitude: currentProperty?.coordinates?.latitude || 0,
        longitude: currentProperty?.coordinates?.longitude || 0,
      },
      amenities: currentProperty?.amenities || [],
      host: {
        host_id: currentProperty?.host?.host_id || '',
        host_name: currentProperty?.host?.host_name || '',
        host_since: currentProperty?.host?.host_since || new Date().toISOString(),
        host_location: currentProperty?.host?.host_location || '',
        host_about: currentProperty?.host?.host_about || '',
        host_response_time: currentProperty?.host?.host_response_time || '',
        host_response_rate: currentProperty?.host?.host_response_rate || 0,
        host_acceptance_rate: currentProperty?.host?.host_acceptance_rate || 0,
        host_is_superhost: currentProperty?.host?.host_is_superhost || false,
        host_thumbnail_url: currentProperty?.host?.host_thumbnail_url || '',
        host_picture_url: currentProperty?.host?.host_picture_url || '',
        host_listings_count: currentProperty?.host?.host_listings_count || 0,
        host_total_listings_count: currentProperty?.host?.host_total_listings_count || 0,
        host_verifications: currentProperty?.host?.host_verifications || [],
        host_has_profile_pic: currentProperty?.host?.host_has_profile_pic || false,
        host_identity_verified: currentProperty?.host?.host_identity_verified || false,
      },
      features: currentProperty?.features || {},
      availability: currentProperty?.availability || {},
      instant_bookable: currentProperty?.instant_bookable || false,
      is_business_travel_ready: currentProperty?.is_business_travel_ready || false,
      require_guest_profile_picture: currentProperty?.require_guest_profile_picture || false,
      require_guest_phone_verification: currentProperty?.require_guest_phone_verification || false,
      space: currentProperty?.space || '',
      neighborhood_overview: currentProperty?.neighborhood_overview || '',
      notes: currentProperty?.notes || '',
      transit: currentProperty?.transit || '',
      access: currentProperty?.access || '',
      interaction: currentProperty?.interaction || '',
      house_rules: currentProperty?.house_rules || '',
      images: currentProperty?.images || [],
    }),
    [currentProperty]
  );

  const methods = useForm<CreatePropertySchemaType>({
    mode: 'all',
    resolver: zodResolver(CreatePropertySchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      createProperty(
        { data: data as CreatePropertyDto },
        {
          onSuccess: () => {
            toast.success('Property created successfully!');
            router.push(paths.dashboard.properties.list);
          },
          onError: (error) => {
            console.error('Failed to create property:', error);
            toast.error('Failed to create property');
          },
        }
      );
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An error occurred while creating the property');
    }
  });

  const handleReset = useCallback(() => {
    reset(defaultValues);
  }, [reset, defaultValues]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Basic Information
            </Typography>

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="name" label="Property Name" />
              <Field.Select
                name="property_type"
                label="Property Type"
                options={PROPERTY_TYPE_OPTIONS}
              />
              <Field.Select name="room_type" label="Room Type" options={ROOM_TYPE_OPTIONS} />
              <Field.Select name="bed_type" label="Bed Type" options={BED_TYPE_OPTIONS} />
            </Box>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <Field.Text name="summary" label="Summary" multiline rows={2} />
              <Field.Text name="description" label="Description" multiline rows={4} />
            </Stack>
          </Card>

          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Property Details
            </Typography>

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(4, 1fr)' },
              }}
            >
              <Field.NumberInput name="accommodates" label="Guests" min={1} />
              <Field.NumberInput name="bedrooms" label="Bedrooms" min={0} />
              <Field.NumberInput name="beds" label="Beds" min={1} />
              <Field.NumberInput name="bathrooms" label="Bathrooms" min={0} step={0.5} />
            </Box>
          </Card>

          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Pricing
            </Typography>

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.NumberInput name="price.base_price" label="Base Price" min={1} />
              <Field.NumberInput name="price.price_per_night" label="Price per Night" min={1} />
              <Field.Text name="price.currency" label="Currency" />
              <Field.Text name="price.currency_symbol" label="Currency Symbol" />
              <Field.NumberInput
                name="price.weekly_discount"
                label="Weekly Discount (%)"
                min={0}
                max={100}
              />
              <Field.NumberInput
                name="price.monthly_discount"
                label="Monthly Discount (%)"
                min={0}
                max={100}
              />
              <Field.NumberInput name="price.cleaning_fee" label="Cleaning Fee" min={0} />
              <Field.NumberInput name="price.security_deposit" label="Security Deposit" min={0} />
              <Field.NumberInput name="price.extra_people_fee" label="Extra People Fee" min={0} />
            </Box>
          </Card>

          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Location
            </Typography>

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="address.street" label="Street Address" />
              <Field.Text name="address.suburb" label="Suburb" />
              <Field.Text name="address.government_area" label="Government Area" />
              <Field.Text name="address.market" label="Market" />
              <Field.CountrySelect name="address.country" label="Country" />
              <Field.Text name="address.country_code" label="Country Code" />
              <Field.NumberInput
                name="coordinates.latitude"
                label="Latitude"
                min={-90}
                max={90}
                step={0.000001}
              />
              <Field.NumberInput
                name="coordinates.longitude"
                label="Longitude"
                min={-180}
                max={180}
                step={0.000001}
              />
            </Box>
          </Card>

          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Host Information
            </Typography>

            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="host.host_id" label="Host ID" />
              <Field.Text name="host.host_name" label="Host Name" />
              <Field.Text name="host.host_location" label="Host Location" />
              <Field.NumberInput
                name="host.host_response_rate"
                label="Response Rate (%)"
                min={0}
                max={100}
              />
              <Field.NumberInput
                name="host.host_acceptance_rate"
                label="Acceptance Rate (%)"
                min={0}
                max={100}
              />
              <Field.NumberInput name="host.host_listings_count" label="Listings Count" min={0} />
            </Box>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <Field.Text name="host.host_about" label="About Host" multiline rows={3} />
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Booking Rules
            </Typography>

            <Stack spacing={3}>
              <Field.NumberInput name="minimum_nights" label="Minimum Nights" min={1} />
              <Field.NumberInput name="maximum_nights" label="Maximum Nights" min={1} />
              <Field.Select
                name="cancellation_policy"
                label="Cancellation Policy"
                options={CANCELLATION_POLICY_OPTIONS}
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 3 }}>
              Property Settings
            </Typography>

            <Stack spacing={2}>
              <Field.Switch name="instant_bookable" label="Instant Bookable" />
              <Field.Switch name="is_business_travel_ready" label="Business Travel Ready" />
              <Field.Switch
                name="require_guest_profile_picture"
                label="Require Guest Profile Picture"
              />
              <Field.Switch
                name="require_guest_phone_verification"
                label="Require Phone Verification"
              />
              <Field.Switch name="host.host_is_superhost" label="Host is Superhost" />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 3 }}>
              Features
            </Typography>

            <Stack spacing={2}>
              <Field.Switch name="features.wifi" label="WiFi" />
              <Field.Switch name="features.kitchen" label="Kitchen" />
              <Field.Switch name="features.air_conditioning" label="Air Conditioning" />
              <Field.Switch name="features.heating" label="Heating" />
              <Field.Switch name="features.hot_water" label="Hot Water" />
              <Field.Switch name="features.free_parking" label="Free Parking" />
              <Field.Switch name="features.pool" label="Pool" />
              <Field.Switch name="features.pets_allowed" label="Pets Allowed" />
              <Field.Switch name="features.smoking_allowed" label="Smoking Allowed" />
              <Field.Switch name="features.wheelchair_accessible" label="Wheelchair Accessible" />
              <Field.Switch name="features.family_kid_friendly" label="Family/Kid Friendly" />
              <Field.Switch name="features.elevator_in_building" label="Elevator in Building" />
              <Field.Switch
                name="features.laptop_friendly_workspace"
                label="Laptop Friendly Workspace"
              />
              <Field.Switch name="features.suitable_for_events" label="Suitable for Events" />
            </Stack>
          </Card>

          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Amenities
            </Typography>

            <Field.MultiCheckbox
              name="amenities"
              options={COMMON_AMENITIES.map((amenity) => ({ label: amenity, value: amenity }))}
            />
          </Card>
        </Grid>

        <Grid size={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Additional Information
            </Typography>

            <Stack spacing={3}>
              <Field.Text name="space" label="About the Space" multiline rows={3} />
              <Field.Text
                name="neighborhood_overview"
                label="Neighborhood Overview"
                multiline
                rows={3}
              />
              <Field.Text name="notes" label="Notes" multiline rows={2} />
              <Field.Text name="transit" label="Transit Information" multiline rows={2} />
              <Field.Text name="access" label="Access Instructions" multiline rows={2} />
              <Field.Text name="interaction" label="Host Interaction" multiline rows={2} />
              <Field.Text name="house_rules" label="House Rules" multiline rows={3} />
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                Create Property
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
