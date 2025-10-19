import type { IconsaxPickerProps } from 'src/components/iconsax-picker';

import { Controller, useFormContext } from 'react-hook-form';

import { IconsaxPicker } from 'src/components/iconsax-picker';

// ----------------------------------------------------------------------

export type RHFIconsaxPickerProps = IconsaxPickerProps & {
  name: string;
};

export function RHFIconsaxPicker({ name, helperText, ...other }: RHFIconsaxPickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <IconsaxPicker
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
