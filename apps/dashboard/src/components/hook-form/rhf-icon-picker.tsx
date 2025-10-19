import type { IconPickerProps } from 'src/components/icon-picker';

import { Controller, useFormContext } from 'react-hook-form';

import { IconPicker } from 'src/components/icon-picker';

// ----------------------------------------------------------------------

export type RHFIconPickerProps = IconPickerProps & {
  name: string;
};

export function RHFIconPicker({ name, helperText, ...other }: RHFIconPickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <IconPicker
          {...field}
          onChange={(value) => field.onChange(value)}
          error={!!error}
          helperText={error?.message ?? helperText}
          {...other}
        />
      )}
    />
  );
}
