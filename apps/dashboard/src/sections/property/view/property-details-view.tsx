'use client';

import type {
  PropertyResponseDto,
  PropertyResponseDtoStatus,
  UpdatePropertyStatusDtoStatus,
} from 'src/api/models/admin';

import { useState, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { usePropertiesAdminControllerUpdatePropertyStatus } from 'src/api/queries/admin/properties-management/properties-management';

import { toast } from 'src/components/snackbar';

import { PropertyDetailsToolbar } from '../property-details-toolbar';
import { PropertyDetailsContent } from '../property-details-content';

// ----------------------------------------------------------------------

type Props = {
  property: PropertyResponseDto;
};

export function PropertyDetailsView({ property }: Props) {
  const [status, setStatus] = useState<PropertyResponseDtoStatus>(property?.status || 'draft');

  const updatePropertyStatusMutation = usePropertiesAdminControllerUpdatePropertyStatus();

  const handleChangeStatus = useCallback(
    (newValue: string) => {
      if (!property?._id) return;

      // Prevent status changes on deleted properties
      if (status === 'deleted') {
        toast.warning('Cannot change status of a deleted property');
        return;
      }

      setStatus(newValue as PropertyResponseDtoStatus);

      updatePropertyStatusMutation.mutate(
        {
          id: property._id,
          data: { status: newValue as UpdatePropertyStatusDtoStatus },
        },
        {
          onSuccess: () => {
            toast.success(`Property status updated to '${newValue}' successfully`);
          },
          onError: (error) => {
            console.error('Failed to update property status:', error);
            toast.error('Failed to update property status. Please try again.');
            setStatus(property.status as PropertyResponseDtoStatus); // Revert on error
          },
        }
      );
    },
    [property, status, updatePropertyStatusMutation]
  );

  const renderToolbar = () => (
    <PropertyDetailsToolbar
      backHref={paths.dashboard.properties.root}
      editHref={paths.dashboard.properties.edit(`${property?._id}`)}
      liveHref="#"
      status={status}
      onChangeStatus={handleChangeStatus}
      property={property}
      isStatusLoading={updatePropertyStatusMutation.isPending}
    />
  );

  return (
    <DashboardContent>
      {renderToolbar()}

      <PropertyDetailsContent property={property} />
    </DashboardContent>
  );
}
