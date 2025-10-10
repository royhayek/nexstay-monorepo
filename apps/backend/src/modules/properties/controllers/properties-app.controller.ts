import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BaseController } from '../../../common/controllers/base.controller';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { PropertyStatus } from '../../../common/enums/property.enums';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { UpdatePropertyStatusDto } from '../dto/update-property-status.dto';
import { InternalCreatePropertyDto } from '../dto/internal-property.dto';
import { PropertyResponseDto } from '../dto/property-response.dto';
import {
  PropertyListResponse,
  PropertyDeletionResponse,
  ImageUploadResponse,
  MultipleImageUploadResponse,
  ImageDeletionResponse,
  SinglePropertyResponse,
  PropertyListResponseDto,
  PropertyDeletionResponseDto,
  ImageUploadResponseDto,
  MultipleImageUploadResponseDto,
  ImageDeletionResponseDto,
  SinglePropertyResponseDto,
} from '../dto/property-operation-response.dto';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { PropertiesFacadeService } from '../services/properties-facade.service';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { S3Service, FileCategory } from '../../storage/services/s3.service';
import { PropertyImagesUploadInterceptor } from '../../storage/interceptors/file-upload.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropertyImageValidationPipe } from '../../storage/pipes/file-validation.pipe';
import { ImageSize } from '../../storage/services/image-processing.service';
import {
  MultiplePropertyImageUploadDto,
  PropertyImageUploadDto,
} from '../dto/property-image-response.dto';

/**
 * App Controller for Properties
 * Handles property operations for mobile app and website users (Hosts)
 */
@Controller('app/properties')
@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PropertiesAppController extends BaseController {
  constructor(
    private readonly propertiesFacade: PropertiesFacadeService,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  @Get('my-properties')
  @ProtectedEndpoint(
    'Get current user properties (Host only)',
    'Retrieve all properties owned by the authenticated user',
    PropertyListResponseDto,
  )
  async getMyProperties(@CurrentUser() user: UserDocument): Promise<PropertyListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const properties = await this.propertiesFacade.findByUserId(String(user._id));
        return {
          properties: properties.map((property) =>
            plainToInstance(PropertyResponseDto, property.toObject()),
          ),
        };
      },
      'Get my properties',
      'My Properties List',
      'Properties retrieved successfully',
      'Failed to retrieve properties',
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Create a new property (Host only)',
    'Create a new property listing with host privileges',
    SinglePropertyResponseDto,
  )
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser() user: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const internalDto: InternalCreatePropertyDto = {
          ...createPropertyDto,
          // Automatically set top-level pricePerNight from price.pricePerNight to avoid redundancy
          pricePerNight: createPropertyDto.price.pricePerNight,
          ownerId: String(user._id),
        };
        const property = await this.propertiesFacade.create(internalDto);
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Create property',
      'Property created successfully',
      'Failed to create property',
    );
  }

  @Get(':id')
  @ProtectedEndpoint(
    'Get property by ID (owned by current user)',
    'Retrieve property details for properties owned by the current user',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Verify ownership and get property
        const isOwner = await this.propertiesFacade.verifyOwnership(id, String(user._id));
        if (!isOwner) {
          throw new Error('FORBIDDEN');
        }
        const property = await this.propertiesFacade.findById(id);
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Get property',
      'Property Details',
      'Property retrieved successfully',
      'Failed to retrieve property',
    );
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Update property (Host only)',
    'Update property details with host privileges',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'Property updated successfully',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Host role required or not property owner' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const isOwner = await this.propertiesFacade.verifyOwnership(id, String(user._id));
        if (!isOwner) {
          throw new Error('FORBIDDEN');
        }
        const property = await this.propertiesFacade.update(id, updatePropertyDto);
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Update property',
      'Property Updated',
      'Property updated successfully',
      'Failed to update property',
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Delete property (Host only)',
    'Delete a property. Only the owner, admin, or system admin can delete.',
    PropertyDeletionResponseDto,
  )
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<PropertyDeletionResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const isOwner = await this.propertiesFacade.verifyOwnership(id, String(user._id));
        if (!isOwner) {
          throw new Error('FORBIDDEN');
        }
        await this.propertiesFacade.delete(id);
        return { deleted: true, propertyId: id };
      },
      'Delete property',
      'Property deleted successfully',
      'Failed to delete property',
    );
  }

  @Put(':id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Toggle property active status (Host only)',
    'Toggle the active/inactive status of a property',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'Property status toggled successfully',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Host role required or not property owner' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async toggleStatus(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const isOwner = await this.propertiesFacade.verifyOwnership(id, String(user._id));
        if (!isOwner) {
          throw new Error('FORBIDDEN');
        }
        const property = await this.propertiesFacade.findById(id);
        const newStatus =
          property.status === PropertyStatus.PUBLISHED
            ? PropertyStatus.DRAFT
            : PropertyStatus.PUBLISHED;
        const updatedProperty = await this.propertiesFacade.updateStatus(id, newStatus);
        return plainToInstance(PropertyResponseDto, updatedProperty.toObject());
      },
      'Toggle property status',
      'Status Toggled',
      'Property status toggled successfully',
      'Failed to toggle property status',
    );
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Update property status (Host only)',
    'Update property status to a specific value',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'Property status updated successfully',
    type: PropertyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Host role required or not property owner' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePropertyStatusDto,
    @CurrentUser() user: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const isOwner = await this.propertiesFacade.verifyOwnership(id, String(user._id));
        if (!isOwner) {
          throw new Error('FORBIDDEN');
        }
        const updatedProperty = await this.propertiesFacade.updateStatus(
          id,
          updateStatusDto.status,
        );
        return plainToInstance(PropertyResponseDto, updatedProperty.toObject());
      },
      'Update property status',
      'Property Status Updated',
      'Property status updated successfully',
      'Failed to update property status',
    );
  }

  // Image upload endpoints

  @Post('images/upload')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Upload property images',
    'Upload multiple property images with automatic processing',
    MultipleImageUploadResponseDto,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Property image files (up to 10)',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Property image files (JPEG, PNG, WebP)',
        },
      },
      required: ['images'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    type: MultiplePropertyImageUploadDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Host role required' })
  @ApiResponse({ status: 500, description: 'Upload failed' })
  @UseInterceptors(PropertyImagesUploadInterceptor)
  async uploadPropertyImages(
    @UploadedFiles(PropertyImageValidationPipe) files: Express.Multer.File[],
    @CurrentUser() user: UserDocument,
  ): Promise<MultipleImageUploadResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        if (!files || files.length === 0) {
          throw new BadRequestException('At least one file is required');
        }

        const uploadPromises = files.map((file) =>
          this.s3Service.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            FileCategory.PROPERTY_IMAGES,
            String(user._id),
          ),
        );

        const results = await Promise.all(uploadPromises);

        const uploadResults = results.map((result) => ({
          key: result.key,
          url: result.url,
          thumbnailUrl: result.variants?.find((v) => v.size === ImageSize.THUMBNAIL)?.url || '',
          variants: result.variants || [],
        }));

        return {
          files: uploadResults,
          count: uploadResults.length,
        };
      },
      'Upload Images',
      'Property Images Upload',
      'Images uploaded successfully',
      'Failed to upload images',
    );
  }

  @Post('images/upload-single')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Upload single property image',
    'Upload a single property image with automatic processing',
    ImageUploadResponseDto,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Single property image file',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Property image file (JPEG, PNG, WebP)',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: PropertyImageUploadDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Host role required' })
  @ApiResponse({ status: 500, description: 'Upload failed' })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (_, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadSinglePropertyImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserDocument,
  ): Promise<ImageUploadResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        LoggingUtil.debugLog('Single Image Upload Debug', undefined, 'PropertiesController');
        if (file) {
          LoggingUtil.debugLog(
            'File received',
            {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              fieldname: file.fieldname,
            },
            'PropertiesController',
          );
        } else {
          LoggingUtil.debugLog('No file received', undefined, 'PropertiesController');
        }
        LoggingUtil.debugLog('End Debug', undefined, 'PropertiesController');

        if (!file) {
          throw new BadRequestException('File is required');
        }

        const result = await this.s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          FileCategory.PROPERTY_IMAGES,
          String(user._id),
        );

        return {
          key: result.key,
          url: result.url,
          thumbnailUrl: result.variants?.find((v) => v.size === ImageSize.THUMBNAIL)?.url || '',
          variants: result.variants || [],
        };
      },
      'Upload Image',
      'Property Image Upload',
      'Image uploaded successfully',
      'Failed to upload image',
    );
  }

  @Delete('images/:key')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Delete property image',
    'Delete a property image from storage and database',
    ImageDeletionResponseDto,
  )
  @ApiParam({ name: 'key', description: 'Image key/identifier' })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Delete Image' },
        message: { type: 'string', example: 'Image deleted successfully' },
        data: {
          type: 'object',
          properties: {
            deleted: { type: 'boolean', example: true },
            key: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Host role required' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  @ApiResponse({ status: 500, description: 'Delete failed' })
  async deletePropertyImage(@Param('key') key: string): Promise<ImageDeletionResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // This would require storing image ownership in database
        await this.s3Service.deleteFile(key);

        return {
          deleted: true,
          key,
        };
      },
      'Delete Image',
      'Property Image Deleted',
      'Image deleted successfully',
      'Failed to delete image',
    );
  }
}
