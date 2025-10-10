import { ConfigCategory } from '../../database/schemas/app-config.schema';

export interface ConfigUpdateData {
  value: string;
  description?: string;
  title?: string;
  category?: ConfigCategory;
  sortOrder?: number;
}
