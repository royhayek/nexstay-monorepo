import { ConfigDataDto } from '../dto/config-response.dto';

// ================================
// Response Interfaces
// ================================

export interface ConfigListResponse {
  status: string;
  message: string;
  data: ConfigDataDto[];
}

export interface ConfigSingleResponse {
  status: string;
  message: string;
  data: ConfigDataDto;
}

export interface ConfigGroupedResponse {
  status: string;
  message: string;
  data: Record<string, ConfigDataDto[]>;
}

export interface ConfigDeleteResponse {
  status: string;
  message: string;
  data: {
    success: boolean;
  };
}
