'use client';

import { useParams } from 'next/navigation';

import { usePropertiesAdminControllerGetPropertyById } from 'src/api/queries/admin/properties-management/properties-management';

import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';

import { PropertyDetailsView } from 'src/sections/property/view/property-details-view';

// ----------------------------------------------------------------------

export default function PropertyDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    data: propertyData,
    isLoading,
    error,
    refetch,
  } = usePropertiesAdminControllerGetPropertyById(id);

  const property = propertyData?.data;

  if (isLoading) {
    return <LoadingState title="Loading property..." size="large" fullHeight />;
  }

  if (error) {
    return (
      <ErrorState
        onRetry={() => refetch()}
        title="Failed to load property"
        subtitle="Unable to load property details. Please try again."
      />
    );
  }

  if (!property) {
    return <ErrorState title="Property not found" subtitle="Unable to find property details." />;
  }

  return <PropertyDetailsView property={property} />;
}
