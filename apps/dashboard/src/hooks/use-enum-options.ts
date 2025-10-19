import { useMemo } from 'react';

import type { EnumOption, GetEnumOptionsConfig } from 'src/utils/get-enum-options';

import { getEnumOptions, getMultipleEnumOptions } from 'src/utils/get-enum-options';

/**
 * Hook to get static enum options
 * Replaces deprecated useEnumDisplayOptions
 *
 * @param enumName - Name of the enum
 * @param config - Configuration options
 * @returns Array of enum options
 */
export function useEnumOptions(
  enumName: string,
  config?: GetEnumOptionsConfig
): EnumOption[] {
  return useMemo(() => getEnumOptions(enumName, config), [enumName, config]);
}

/**
 * Hook to get multiple enum options at once
 * Replaces deprecated useMultipleEnumDisplayOptions
 *
 * @param enumNames - Array of enum names
 * @returns Record of enum names to their options
 */
export function useMultipleEnumOptions(
  enumNames: string[]
): Record<string, EnumOption[]> {
  return useMemo(() => getMultipleEnumOptions(enumNames), [enumNames]);
}
