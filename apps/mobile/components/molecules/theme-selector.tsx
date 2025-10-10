import { useThemePreference } from '@/hooks/use-theme-preference';
import React from 'react';
import { SegmentedControl, SegmentedControlOption } from './segmented-control';

export interface ThemeSelectorProps {
  size?: "small" | "medium" | "large";
  variant?: "default" | "filled";
  fullWidth?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  size = "medium",
  variant = "default",
  fullWidth = true,
}) => {
  const { themePreference, setThemePreference } = useThemePreference();

  const themeOptions: SegmentedControlOption[] = [
    {
      value: 'light',
      label: 'Light',
    },
    {
      value: 'dark',
      label: 'Dark',
    },
    {
      value: 'system',
      label: 'System',
    },
  ];

  return (
    <SegmentedControl
      options={themeOptions}
      selectedValue={themePreference}
      onValueChange={(value) => setThemePreference(value as 'light' | 'dark' | 'system')}
      size={size}
      variant={variant}
      fullWidth={fullWidth}
    />
  );
};