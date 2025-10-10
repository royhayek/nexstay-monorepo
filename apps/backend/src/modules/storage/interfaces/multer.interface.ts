export interface EnhancedMulterFile extends Express.Multer.File {
  processedVariants?: {
    key: string;
    url: string;
    size: string;
    contentType: string;
  }[];
  uploadMetadata?: {
    category: string;
    userId?: string;
    timestamp: Date;
  };
}

export interface FileValidationContext {
  file: Express.Multer.File;
  category: string;
  userId?: string;
  allowedMimeTypes?: string[];
  maxSize?: number;
}

export interface FileUploadResult {
  success: boolean;
  file?: EnhancedMulterFile;
  error?: string;
}
