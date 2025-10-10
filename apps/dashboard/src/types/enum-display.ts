export type { EnumDisplayDataDto as IEnumDisplayItem } from 'src/api/models';
export type { CreateEnumDisplayDto as IEnumDisplayCreate } from 'src/api/models';
export type { UpdateEnumDisplayDto as IEnumDisplayUpdate } from 'src/api/models';
export type { EnumDisplayResponseDto as IEnumDisplayResponse } from 'src/api/models';

export interface IEnumDisplayTableFilters {
  enumName: string[];
  isVisible: string[];
  search?: string;
}
