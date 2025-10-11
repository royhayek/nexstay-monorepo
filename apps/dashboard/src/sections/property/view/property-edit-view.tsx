'use client';

import { usePropertiesAdminControllerGetPropertyById } from 'src/api/queries/admin/properties-management/properties-management';

import { PropertyFormProvider } from '../property-form-provider';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function PropertyEditView({ id }: Props) {
  const { data: propertyResponse } = usePropertiesAdminControllerGetPropertyById(id);
  const property = propertyResponse?.data;

  return <PropertyFormProvider currentProperty={property} />;
}
