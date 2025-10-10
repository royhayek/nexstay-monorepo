import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ApiQuery, ApiParam, ApiConsumes, ApiBody, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { plainToInstance } from 'class-transformer';
import { BaseController } from '../../../common/controllers/base.controller';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { UpdatePropertyStatusDto } from '../dto/update-property-status.dto';
import { PropertyListResponseDto, PropertyResponseDto } from '../dto/property-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { PropertyDropdownResponseDto } from '../dto/property-search.dto';
import {
  ImageDeletionResponse,
  PropertyDeletionResponse,
  SinglePropertyResponse,
  SinglePropertyResponseDto,
  ImageDeletionResponseDto,
  PropertyDeletionResponseDto,
} from '../dto/property-operation-response.dto';
import { PropertiesFacadeService } from '../services/properties-facade.service';
import { S3Service, FileCategory } from '../../storage/services/s3.service';
import { ImageSize } from '../../storage/services/image-processing.service';
import { PropertyImagesUploadInterceptor } from '../../storage/interceptors/file-upload.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropertyImageValidationPipe } from '../../storage/pipes/file-validation.pipe';
import {
  MultiplePropertyImageUploadResponseDto,
  PropertyImageUploadResponseDto,
} from '../dto/property-image-response.dto';

/**
 * Admin Controller for Properties
 * Handles administrative property management operations
 */
@Controller('admin/properties')
@ApiTags('Properties Management')
@ApiExtraModels(PropertyResponseDto, PaginatedDto)
export class PropertiesAdminController extends BaseController {
  constructor(
    private readonly propertiesFacade: PropertiesFacadeService,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  @Get()
  @AdminEndpoint(
    'Get all properties with filtering and pagination (Admin only)',
    'Retrieve properties with advanced filtering capabilities for administrators',
    PropertyListResponseDto,
  )
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by property title or location',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by property status',
  })
  @ApiQuery({ name: 'hostId', required: false, type: String, description: 'Filter by host ID' })
  @ApiQuery({
    name: 'propertyType',
    required: false,
    type: String,
    description: 'Filter by property type (comma-separated for multiple)',
  })
  @ApiQuery({
    name: 'roomType',
    required: false,
    type: String,
    description: 'Filter by room type (comma-separated for multiple)',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Filter by minimum price per night',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Filter by maximum price per night',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Filter by minimum average rating',
  })
  @ApiQuery({
    name: 'isPublished',
    required: false,
    type: String,
    description: 'Filter by published status (true/false)',
  })
  @ApiQuery({
    name: 'instantBookable',
    required: false,
    type: String,
    description: 'Filter by instant bookable status (true/false)',
  })
  @ApiQuery({
    name: 'businessTravelReady',
    required: false,
    type: String,
    description: 'Filter by business travel ready status (true/false)',
  })
  @ApiQuery({
    name: 'isSuperhost',
    required: false,
    type: String,
    description: 'Filter by superhost status (true/false)',
  })
  async getAllProperties(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('hostId') hostId?: string,
    @Query('propertyType') propertyType?: string,
    @Query('roomType') roomType?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minRating') minRating?: number,
    @Query('isPublished') isPublished?: string,
    @Query('instantBookable') instantBookable?: string,
    @Query('businessTravelReady') businessTravelReady?: string,
    @Query('isSuperhost') isSuperhost?: string,
  ): Promise<PropertyListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.propertiesFacade.findAllAdmin({
          page,
          limit: Math.min(limit, 100),
          search,
          status,
          hostId,
          type: propertyType,
          roomType,
          minPrice,
          maxPrice,
          minRating,
          isPublished,
          instantBookable,
          businessTravelReady,
          isSuperhost,
        });

        const items = result.items.map((property) =>
          plainToInstance(PropertyResponseDto, property.toObject()),
        );

        return {
          items,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get all properties',
      'Properties List',
      'Properties retrieved successfully',
      'Failed to retrieve properties',
    );
  }

  @Get('search')
  @AdminEndpoint(
    'Search properties',
    'Search for properties by name for dropdown selection',
    PropertyDropdownResponseDto,
  )
  @ApiQuery({
    name: 'search',
    required: true,
    type: String,
    description: 'Search term to match property name',
  })
  async searchProperties(@Query('search') search: string): Promise<PropertyDropdownResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        if (!search?.trim()) {
          throw new BadRequestException('Search query is required');
        }
        const properties = await this.propertiesFacade.findPropertiesForDropdown(search.trim());
        const propertyList = Array.isArray(properties) ? properties : [];
        return {
          properties: propertyList.map((property) => ({
            _id: String(property._id),
            name: property.name,
          })),
          total: propertyList.length,
        };
      },
      'Search properties',
      'Properties Search',
      'Properties retrieved successfully',
      'Failed to retrieve properties',
    );
  }

  @Get(':id')
  @AdminEndpoint(
    'Get property by ID (Admin only)',
    'Retrieve detailed property information by ID for administrators',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async getPropertyById(@Param('id') id: string): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.findById(id);
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Get property by ID',
      'Property Details',
      'Property retrieved successfully',
      'Failed to retrieve property',
    );
  }

  @Put(':id')
  @AdminEndpoint(
    'Update property by admin (Admin only)',
    'Update property details with administrative privileges',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async updateProperty(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.updateByAdmin(
          id,
          updatePropertyDto,
          String(adminUser._id),
        );
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Update property',
      'Property Updated',
      'Property updated successfully',
      'Failed to update property',
    );
  }

  @Delete('images')
  @AdminEndpoint(
    'Delete property image (Admin only)',
    'Delete a property image from storage and database',
    ImageDeletionResponseDto,
  )
  @ApiQuery({
    name: 'key',
    description: 'Image key/identifier',
    example: 'property-images/user-id/date/image-file.webp',
  })
  async deletePropertyImage(@Query('key') key: string): Promise<ImageDeletionResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Delete from S3
        await this.s3Service.deleteImageWithVariants(key);

        // Remove image from database
        this.propertiesFacade.removeImageFromProperty(key);

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

  @Delete(':id')
  @AdminEndpoint(
    'Delete property by admin (Admin only)',
    'Permanently delete a property from the system',
    PropertyDeletionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async deleteProperty(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<PropertyDeletionResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.propertiesFacade.deleteByAdmin(id, String(adminUser._id));
        return { deleted: true, propertyId: id };
      },
      'Delete property',
      'Property Deleted',
      'Property deleted successfully',
      'Failed to delete property',
    );
  }

  @Put(':id/toggle-status')
  @AdminEndpoint(
    'Toggle property status (Admin only)',
    'Toggle the active/inactive status of a property',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async togglePropertyStatus(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.toggleStatusByAdmin(id, String(adminUser._id));
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Toggle property status',
      'Status Toggled',
      'Property status toggled successfully',
      'Failed to toggle property status',
    );
  }

  @Put(':id/status')
  @AdminEndpoint(
    'Update property status (Admin only)',
    'Update the status of a property to a specific value',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePropertyStatusDto,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.updateStatus(id, updateStatusDto.status);
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Update property status',
      'Property Status Updated',
      'Property status updated successfully',
      'Failed to update property status',
    );
  }

  @Put(':id/toggle-published')
  @AdminEndpoint(
    'Toggle property published status (Admin only)',
    'Toggle the published/unpublished status of a property',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async togglePropertyPublished(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.togglePublishedByAdmin(
          id,
          String(adminUser._id),
        );
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Toggle property published status',
      'Published Status Toggled',
      'Property published status toggled successfully',
      'Failed to toggle property published status',
    );
  }

  @Put(':id/approve')
  @AdminEndpoint(
    'Approve property (Admin/Moderator only)',
    'Approve a property for listing on the platform',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async approveProperty(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.approveProperty(id, String(adminUser._id));
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Approve property',
      'Property Approved',
      'Property approved successfully',
      'Failed to approve property',
    );
  }

  @Put(':id/reject')
  @AdminEndpoint(
    'Reject property (Admin/Moderator only)',
    'Reject a property listing with reason for denial',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async rejectProperty(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SinglePropertyResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.rejectProperty(id, String(adminUser._id));
        return plainToInstance(PropertyResponseDto, property.toObject());
      },
      'Reject property',
      'Property Rejected',
      'Property rejected successfully',
      'Failed to reject property',
    );
  }

  // Image upload endpoints for admin

  @Post('images/upload')
  @AdminEndpoint(
    'Upload property images (Admin only)',
    'Upload multiple property images with automatic processing',
    MultiplePropertyImageUploadResponseDto,
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
  @UseInterceptors(PropertyImagesUploadInterceptor)
  async uploadPropertyImages(
    @UploadedFiles(PropertyImageValidationPipe) files: Express.Multer.File[],
    @CurrentUser() adminUser: UserDocument,
  ): Promise<MultiplePropertyImageUploadResponseDto> {
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
            String(adminUser._id),
          ),
        );

        const results = await Promise.all(uploadPromises);

        const uploadResults = results.map((result) => {
          // Find specific variant URLs for quick access
          const thumbnailVariant = result.variants?.find((v) => v.size === ImageSize.THUMBNAIL);

          return {
            key: result.key,
            url: result.url,
            thumbnailUrl: thumbnailVariant?.url || result.url,
            variants:
              result.variants?.map((v) => ({
                size: v.size,
                url: v.url,
                width: v.width,
                height: v.height,
              })) || [],
          };
        });

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
  @AdminEndpoint(
    'Upload single property image (Admin only)',
    'Upload a single property image with automatic processing',
    PropertyImageUploadResponseDto,
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
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (_req, file, callback) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only image files are allowed!'), false);
        }
      },
    }),
  )
  async uploadSinglePropertyImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<PropertyImageUploadResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        if (!file) {
          throw new BadRequestException('File is required');
        }

        const result = await this.s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          FileCategory.PROPERTY_IMAGES,
          String(adminUser._id),
        );

        // Find specific variant URLs for quick access
        const thumbnailVariant = result.variants?.find((v) => v.size === ImageSize.THUMBNAIL);

        return {
          key: result.key,
          url: result.url,
          thumbnailUrl: thumbnailVariant?.url || result.url,
          variants:
            result.variants?.map((v) => ({
              size: v.size,
              url: v.url,
              width: v.width,
              height: v.height,
            })) || [],
        };
      },
      'Upload Image',
      'Property Image Upload',
      'Image uploaded successfully',
      'Failed to upload image',
    );
  }
}
