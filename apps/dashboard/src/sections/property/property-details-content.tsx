import type { PropertyResponseDto } from 'src/api/models/admin';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { Lightbox, useLightBox } from 'src/components/lightbox';

// ----------------------------------------------------------------------

type Props = {
  property?: PropertyResponseDto;
};

export function PropertyDetailsContent({ property }: Props) {
  const slides = property?.images.map((image) => ({ src: image.url })) || [];

  const {
    selected: selectedImage,
    open: openLightbox,
    onOpen: handleOpenLightbox,
    onClose: handleCloseLightbox,
  } = useLightBox(slides);

  const renderGallery = () => (
    <>
      <Box
        sx={{
          gap: 1,
          display: 'grid',
          mb: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
        }}
      >
        {slides.length > 0 && (
          <Image
            alt={slides[0].src}
            src={slides[0].src}
            ratio="1/1"
            onClick={() => handleOpenLightbox(slides[0].src)}
            sx={[
              (theme) => ({
                borderRadius: 2,
                cursor: 'pointer',
                transition: theme.transitions.create('opacity'),
                '&:hover': { opacity: 0.8 },
              }),
            ]}
          />
        )}

        <Box sx={{ gap: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {slides.slice(1, 5).map((slide) => (
            <Image
              key={slide.src}
              alt={slide.src}
              src={slide.src}
              ratio="1/1"
              onClick={() => handleOpenLightbox(slide.src)}
              sx={[
                (theme) => ({
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: theme.transitions.create('opacity'),
                  '&:hover': { opacity: 0.8 },
                }),
              ]}
            />
          ))}
        </Box>
      </Box>

      <Lightbox
        index={selectedImage}
        slides={slides}
        open={openLightbox}
        close={handleCloseLightbox}
      />
    </>
  );

  const renderHead = () => (
    <>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {property?.name}
        </Typography>
        {property?.status === 'deleted' && (
          <Chip
            label="DELETED"
            color="error"
            variant="filled"
            size="medium"
            icon={<Iconify icon="solar:trash-bin-minimalistic-bold" />}
            sx={{
              fontWeight: 'bold',
              '& .MuiChip-label': {
                px: 2,
              },
            }}
          />
        )}
      </Box>

      {property?.description && <Markdown children={property.description} />}

      <Box
        sx={{
          gap: 3,
          mt: 4,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            gap: 0.5,
            display: 'flex',
            alignItems: 'center',
            typography: 'body2',
          }}
        >
          <Iconify icon="eva:star-fill" sx={{ color: 'warning.main' }} />
          <Box component="span" sx={{ typography: 'subtitle2' }}>
            {property?.averageRating?.toFixed(1)}
          </Box>

          <Link sx={{ color: 'text.secondary' }}>({property?.numberOfReviews} reviews)</Link>
        </Box>

        <Box
          sx={{
            gap: 0.5,
            display: 'flex',
            alignItems: 'center',
            typography: 'body2',
          }}
        >
          <Iconify icon="mingcute:location-fill" sx={{ color: 'error.main' }} />
          {property?.address.city}, {property?.address.governmentArea}
        </Box>

        <Box
          sx={{
            gap: 0.5,
            display: 'flex',
            alignItems: 'center',
            typography: 'subtitle2',
          }}
        >
          <Iconify icon="solar:user-bold" sx={{ color: 'info.main' }} />
          <Box component="span" sx={{ typography: 'body2', color: 'text.secondary' }}>
            Hosted by
          </Box>
          {property?.host?.firstName} {property?.host?.lastName}
        </Box>
      </Box>
    </>
  );

  const renderOverview = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Property Overview
      </Typography>

      <Grid container spacing={2}>
        {/* Property Details */}
        {[
          {
            label: 'Property Type',
            value: property?.propertyType,
            icon: <Iconify icon="solar:home-2-bold" />,
          },
          {
            label: 'Room Type',
            value: property?.roomType,
            icon: <Iconify icon="solar:bed-bold" />,
          },
          {
            label: 'Bed Type',
            value: property?.bedType,
            icon: <Iconify icon="solar:sleeping-square-bold" />,
          },
          {
            label: 'Accommodates',
            value: `${property?.accommodates} guests`,
            icon: <Iconify icon="solar:users-group-rounded-bold" />,
          },
          {
            label: 'Bedrooms',
            value: `${property?.bedrooms} bedrooms`,
            icon: <Iconify icon="solar:bed-bold" />,
          },
          {
            label: 'Beds',
            value: `${property?.beds} beds`,
            icon: <Iconify icon="solar:sleeping-square-bold" />,
          },
          {
            label: 'Bathrooms',
            value: `${property?.bathrooms} bathrooms`,
            icon: <Iconify icon="solar:bath-bold" />,
          },
          {
            label: 'Cancellation Policy',
            value: property?.cancellationPolicy,
            icon: <Iconify icon="solar:shield-check-bold" />,
          },
          {
            label: 'Minimum Nights',
            value: `${property?.minimumNights} nights`,
            icon: <Iconify icon="solar:moon-bold" />,
          },
          {
            label: 'Maximum Nights',
            value: `${property?.maximumNights} nights`,
            icon: <Iconify icon="solar:sun-bold" />,
          },
          {
            label: 'Instant Bookable',
            value: property?.instantBookable ? 'Yes' : 'No',
            icon: <Iconify icon="solar:bolt-bold" />,
          },
          {
            label: 'Business Travel Ready',
            value: property?.isBusinessTravelReady ? 'Yes' : 'No',
            icon: <Iconify icon="solar:suitcase-bold" />,
          },
          {
            label: 'Require Profile Picture',
            value: property?.requireGuestProfilePicture ? 'Yes' : 'No',
            icon: <Iconify icon="solar:camera-bold" />,
          },
          {
            label: 'Require Phone Verification',
            value: property?.requireGuestPhoneVerification ? 'Yes' : 'No',
            icon: <Iconify icon="solar:phone-bold" />,
          },
          {
            label: 'Maintenance Mode',
            value: property?.maintenanceMode ? 'Yes' : 'No',
            icon: <Iconify icon="solar:settings-bold" />,
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'center', minHeight: 40 }}>
              {item.icon}
              <ListItemText
                primary={item.label}
                secondary={item.value}
                slotProps={{
                  primary: {
                    sx: { typography: 'body2', color: 'text.secondary', mb: 0.25 },
                  },
                  secondary: {
                    sx: { color: 'text.primary', typography: 'subtitle2' },
                  },
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderPricing = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Pricing Information
      </Typography>

      <Grid container spacing={2}>
        {[
          {
            label: 'Base Price',
            value: fCurrency(property?.price.basePrice),
            icon: <Iconify icon="solar:dollar-minimalistic-bold" />,
          },
          {
            label: 'Price per Night',
            value: fCurrency(property?.price.pricePerNight),
            icon: <Iconify icon="solar:moon-bold" />,
          },
          {
            label: 'Currency',
            value: `${property?.price.currency} (${property?.price.currencySymbol})`,
            icon: <Iconify icon="solar:money-bag-bold" />,
          },
          ...(property?.price.weeklyDiscount
            ? [
                {
                  label: 'Weekly Discount',
                  value: `${property.price.weeklyDiscount}%`,
                  icon: <Iconify icon="solar:calendar-bold" />,
                },
              ]
            : []),
          ...(property?.price.monthlyDiscount
            ? [
                {
                  label: 'Monthly Discount',
                  value: `${property.price.monthlyDiscount}%`,
                  icon: <Iconify icon="solar:calendar-bold" />,
                },
              ]
            : []),
          ...(property?.price.cleaningFee
            ? [
                {
                  label: 'Cleaning Fee',
                  value: fCurrency(property.price.cleaningFee),
                  icon: <Iconify icon="solar:broom-bold" />,
                },
              ]
            : []),
          ...(property?.price.securityDeposit
            ? [
                {
                  label: 'Security Deposit',
                  value: fCurrency(property.price.securityDeposit),
                  icon: <Iconify icon="solar:shield-check-bold" />,
                },
              ]
            : []),
          ...(property?.price.extraPeopleFee
            ? [
                {
                  label: 'Extra People Fee',
                  value: fCurrency(property.price.extraPeopleFee),
                  icon: <Iconify icon="solar:user-plus-bold" />,
                },
              ]
            : []),
          ...(property?.weeklyPrice
            ? [
                {
                  label: 'Weekly Price',
                  value: fCurrency(property.weeklyPrice),
                  icon: <Iconify icon="solar:calendar-bold" />,
                },
              ]
            : []),
          ...(property?.monthlyPrice
            ? [
                {
                  label: 'Monthly Price',
                  value: fCurrency(property.monthlyPrice),
                  icon: <Iconify icon="solar:calendar-bold" />,
                },
              ]
            : []),
          ...(property?.securityDeposit
            ? [
                {
                  label: 'Security Deposit (Direct)',
                  value: fCurrency(property.securityDeposit),
                  icon: <Iconify icon="solar:shield-check-bold" />,
                },
              ]
            : []),
          ...(property?.cleaningFee
            ? [
                {
                  label: 'Cleaning Fee (Direct)',
                  value: fCurrency(property.cleaningFee),
                  icon: <Iconify icon="solar:broom-bold" />,
                },
              ]
            : []),
          ...(property?.extraPeople
            ? [
                {
                  label: 'Extra People Fee (Direct)',
                  value: fCurrency(property.extraPeople),
                  icon: <Iconify icon="solar:user-plus-bold" />,
                },
              ]
            : []),
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'center', minHeight: 40 }}>
              {item.icon}
              <ListItemText
                primary={item.label}
                secondary={item.value}
                slotProps={{
                  primary: {
                    sx: { typography: 'body2', color: 'text.secondary', mb: 0.25 },
                  },
                  secondary: {
                    sx: { color: 'text.primary', typography: 'subtitle2' },
                  },
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAddress = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Location & Address
      </Typography>

      <Grid container spacing={2}>
        {[
          {
            label: 'Country',
            value: property?.address.country,
            icon: <Iconify icon="solar:flag-bold" />,
          },
          {
            label: 'Country Code',
            value: property?.address.countryCode,
            icon: <Iconify icon="solar:code-bold" />,
          },
          ...(property?.address.governorate
            ? [
                {
                  label: 'Governorate/State',
                  value: property.address.state,
                  icon: <Iconify icon="solar:map-bold" />,
                },
              ]
            : []),
          ...(property?.address.state
            ? [
                {
                  label: 'District',
                  value: property.address.district,
                  icon: <Iconify icon="solar:map-point-bold" />,
                },
              ]
            : []),
          ...(property?.address.city
            ? [
                {
                  label: 'City',
                  value: property.address.city,
                  icon: <Iconify icon="mingcute:location-fill" />,
                },
              ]
            : []),
          ...(property?.address.neighborhood
            ? [
                {
                  label: 'Neighborhood',
                  value: property.address.neighborhood,
                  icon: <Iconify icon="solar:buildings-bold" />,
                },
              ]
            : []),
          ...(property?.address.street
            ? [
                {
                  label: 'Street',
                  value: property.address.street,
                  icon: <Iconify icon="solar:road-bold" />,
                },
              ]
            : []),
          ...(property?.address.building
            ? [
                {
                  label: 'Building',
                  value: property.address.building,
                  icon: <Iconify icon="solar:home-2-bold" />,
                },
              ]
            : []),
          ...(property?.address.floor
            ? [
                {
                  label: 'Floor',
                  value: `${property.address.floor}${property.address.floor === 1 ? 'st' : property.address.floor === 2 ? 'nd' : property.address.floor === 3 ? 'rd' : 'th'} floor`,
                  icon: <Iconify icon="solar:layers-bold" />,
                },
              ]
            : []),
          ...(property?.address.apartment
            ? [
                {
                  label: 'Apartment/Unit',
                  value: property.address.apartment,
                  icon: <Iconify icon="solar:door-bold" />,
                },
              ]
            : []),
          ...(property?.address.postalCode
            ? [
                {
                  label: 'Postal Code',
                  value: property.address.postalCode,
                  icon: <Iconify icon="solar:mailbox-bold" />,
                },
              ]
            : []),
          ...(property?.address.landmark
            ? [
                {
                  label: 'Nearby Landmark',
                  value: property.address.landmark,
                  icon: <Iconify icon="solar:point-on-map-bold" />,
                },
              ]
            : []),
        ]
          .filter((item) => item.value)
          .map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'center', minHeight: 40 }}>
                {item.icon}
                <ListItemText
                  primary={item.label}
                  secondary={item.value}
                  slotProps={{
                    primary: {
                      sx: { typography: 'body2', color: 'text.secondary', mb: 0.25 },
                    },
                    secondary: {
                      sx: { color: 'text.primary', typography: 'subtitle2' },
                    },
                  }}
                />
              </Box>
            </Grid>
          ))}
      </Grid>
    </Box>
  );

  const renderHostInfo = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        About Your Host
      </Typography>

      <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src={property?.host?.avatarUrl}
            alt={`${property?.host?.firstName} ${property?.host?.lastName}`}
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <Box>
            <Typography variant="h6">
              {property?.host?.firstName} {property?.host?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Host Status: {property?.host?.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reviews: {property?.host?.reviewCount} | Rating:{' '}
              {property?.host?.averageRating?.toFixed(1)}/5
            </Typography>
            {property?.host?.hostingSince && (
              <Typography variant="body2" color="text.secondary">
                Hosting since: {fDate(property.host.hostingSince)}
              </Typography>
            )}
          </Box>
        </Box>

        {property?.host?.bio && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              About the Host
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {property.host.bio}
            </Typography>
          </Box>
        )}

        <Grid container spacing={2}>
          {[
            {
              label: 'User ID',
              value: property?.host?.id,
              icon: <Iconify icon="solar:user-id-bold" />,
            },
            {
              label: 'Email',
              value: property?.host?.email,
              icon: <Iconify icon="solar:letter-bold" />,
            },
            {
              label: 'Account Status',
              value: property?.host?.status,
              icon: <Iconify icon="solar:shield-check-bold" />,
            },
            {
              label: 'Preferred Language',
              value: property?.host?.locale,
              icon: <Iconify icon="solar:global-bold" />,
            },
            {
              label: 'Member Since',
              value: property?.host?.createdAt ? fDate(property.host.createdAt) : undefined,
              icon: <Iconify icon="solar:calendar-bold" />,
            },
          ]
            .filter((item) => item.value)
            .map((item) => (
              <Grid key={item.label} size={{ xs: 12, md: 6 }}>
                <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                  <ListItemText
                    primary={item.label}
                    secondary={item.value}
                    slotProps={{
                      primary: {
                        sx: { typography: 'body2', color: 'text.secondary' },
                      },
                      secondary: {
                        sx: { mt: 0.5, color: 'text.primary', typography: 'subtitle2' },
                      },
                    }}
                  />
                </Box>
              </Grid>
            ))}
        </Grid>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Verification Status
          </Typography>
          <Grid container spacing={1}>
            {[
              {
                label: 'Email Verified',
                verified: property?.host?.isEmailVerified,
                icon: 'solar:letter-bold',
              },
              {
                label: 'Phone Verified',
                verified: property?.host?.isPhoneVerified,
                icon: 'solar:phone-bold',
              },
              {
                label: 'Identity Verified',
                verified: property?.host?.isIdentityVerified,
                icon: 'solar:shield-check-bold',
              },
            ].map((item) => (
              <Grid key={item.label} size={{ xs: 12, md: 4 }}>
                <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                  <Iconify
                    icon={item.verified ? 'eva:checkmark-circle-2-fill' : 'eva:close-circle-fill'}
                    sx={{ color: item.verified ? 'success.main' : 'error.main' }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );

  const renderReviewScores = () => {
    if (!property?.reviewScores) return null;

    const scores = [
      { label: 'Overall Rating', value: property.reviewScores.reviewScoresRating },
      { label: 'Accuracy', value: property.reviewScores.reviewScoresAccuracy },
      { label: 'Cleanliness', value: property.reviewScores.reviewScoresCleanliness },
      { label: 'Check-in', value: property.reviewScores.reviewScoresCheckin },
      { label: 'Communication', value: property.reviewScores.reviewScoresCommunication },
      { label: 'Location', value: property.reviewScores.reviewScoresLocation },
      { label: 'Value', value: property.reviewScores.reviewScoresValue },
    ].filter((score) => score.value != null);

    if (scores.length === 0) return null;

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Review Scores
        </Typography>
        <Grid container spacing={2}>
          {scores.map((score) => (
            <Grid key={score.label} size={{ xs: 12, md: 6 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{score.label}</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {score.value}/10
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={((score.value ?? 0) / 10) * 100}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderFeatures = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Safety Features
      </Typography>
      <Grid container spacing={2}>
        {[
          { key: 'smokeDetector', label: 'Smoke Detector', icon: 'solar:shield-warning-bold' },
          {
            key: 'carbonMonoxideDetector',
            label: 'Carbon Monoxide Detector',
            icon: 'solar:shield-check-bold',
          },
          { key: 'fireExtinguisher', label: 'Fire Extinguisher', icon: 'solar:fire-bold' },
          { key: 'firstAidKit', label: 'First Aid Kit', icon: 'solar:health-bold' },
          { key: 'safetyCard', label: 'Safety Card', icon: 'solar:card-bold' },
        ]
          .filter((feature) => property?.features?.[feature.key as keyof typeof property.features])
          .map((feature) => (
            <Grid key={feature.key} size={{ xs: 12, md: 6 }}>
              <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                <Iconify icon={feature.icon} sx={{ color: 'success.main' }} />
                <Typography variant="body2">{feature.label}</Typography>
              </Box>
            </Grid>
          ))}
      </Grid>
    </Box>
  );

  const renderContent = () => (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Additional Information
      </Typography>

      {property?.summary && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.summary}
          </Typography>
        </Box>
      )}

      {property?.space && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            The Space
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.space}
          </Typography>
        </Box>
      )}

      {property?.neighborhoodOverview && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Neighborhood Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.neighborhoodOverview}
          </Typography>
        </Box>
      )}

      {property?.houseRules && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            House Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.houseRules}
          </Typography>
        </Box>
      )}

      {property?.transit && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Getting Around
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.transit}
          </Typography>
        </Box>
      )}

      {property?.notes && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Other Things to Note
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.notes}
          </Typography>
        </Box>
      )}

      {property?.access && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Access Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.access}
          </Typography>
        </Box>
      )}

      {property?.interaction && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Interaction with Host
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {property.interaction}
          </Typography>
        </Box>
      )}

      {property?.maintenanceMode && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Maintenance Information
          </Typography>
          <Grid container spacing={2}>
            {[
              ...(property?.maintenanceStart
                ? [
                    {
                      label: 'Maintenance Start',
                      value: fDate(property.maintenanceStart),
                      icon: <Iconify icon="solar:calendar-bold" />,
                    },
                  ]
                : []),
              ...(property?.maintenanceEnd
                ? [
                    {
                      label: 'Maintenance End',
                      value: fDate(property.maintenanceEnd),
                      icon: <Iconify icon="solar:calendar-bold" />,
                    },
                  ]
                : []),
              ...(property?.maintenanceReason
                ? [
                    {
                      label: 'Maintenance Reason',
                      value: property.maintenanceReason,
                      icon: <Iconify icon="solar:info-circle-bold" />,
                    },
                  ]
                : []),
            ].map((item) => (
              <Grid key={item.label} size={{ xs: 12, md: 6 }}>
                <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                  <ListItemText
                    primary={item.label}
                    secondary={item.value}
                    slotProps={{
                      primary: {
                        sx: { typography: 'body2', color: 'text.secondary' },
                      },
                      secondary: {
                        sx: { mt: 0.5, color: 'text.primary', typography: 'subtitle2' },
                      },
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {property?.amenities && property.amenities.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Amenities
          </Typography>
          <Grid container spacing={1}>
            {property?.amenities?.map((amenity) => (
              <Grid key={amenity} size={{ xs: 12, md: 6 }}>
                <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="eva:checkmark-circle-2-outline" sx={{ color: 'primary.main' }} />
                  <Typography variant="body2">{amenity}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {property?.features && <Box sx={{ mb: 4 }}>{renderFeatures()}</Box>}
    </>
  );

  return (
    <>
      {renderGallery()}

      <Box sx={{ mx: 'auto', maxWidth: 720 }}>
        {renderHead()}

        <Divider sx={{ borderStyle: 'dashed', my: 5 }} />

        {renderOverview()}

        <Divider sx={{ borderStyle: 'dashed', my: 5 }} />

        {renderPricing()}

        <Divider sx={{ borderStyle: 'dashed', my: 5 }} />

        {renderAddress()}

        {property?.reviewScores && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 5 }} />
            {renderReviewScores()}
          </>
        )}

        <Divider sx={{ borderStyle: 'dashed', my: 5 }} />

        {renderContent()}

        <Divider sx={{ borderStyle: 'dashed', my: 5 }} />

        {renderHostInfo()}
      </Box>
    </>
  );
}
