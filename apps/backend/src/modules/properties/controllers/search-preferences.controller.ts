import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BaseController, StandardResponse } from '../../../common/controllers/base.controller';
import { SearchPreferencesService } from '../services/search-preferences.service';
import {
  CreateSavedSearchDto,
  UpdateSavedSearchDto,
  SavedSearchDataDto,
  SearchHistoryDataDto,
  SavedSearchResponseDto,
  SavedSearchListResponseDto,
  SearchHistoryListResponseDto,
} from '../dto/saved-search.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { IsPageField, IsLimitField } from '../../../common/validators/standardized-validators';

/**
 * Query DTO for pagination
 */
class PaginationQueryDto {
  @IsPageField({ description: 'Page number' })
  page?: number = 1;

  @IsLimitField({ description: 'Items per page' })
  limit?: number = 10;
}

/**
 * Search Preferences Controller
 * Handles saved searches and search history endpoints
 */
@ApiTags('Search Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('app/search-preferences')
export class SearchPreferencesController extends BaseController {
  constructor(private readonly searchPreferencesService: SearchPreferencesService) {
    super();
  }

  /**
   * Create a new saved search
   */
  @Post('saved-searches')
  @ProtectedEndpoint(
    'Create a new saved search',
    'Save a search with specific filters for quick access later',
    SavedSearchResponseDto,
  )
  async createSavedSearch(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateSavedSearchDto,
  ): Promise<StandardResponse<SavedSearchDataDto>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.searchPreferencesService.createSavedSearch(String(user._id), dto);
      },
      'Create Saved Search',
      'Saved Search Created',
      'Saved search created successfully',
      'Failed to create saved search',
    );
  }

  /**
   * Get all saved searches
   */
  @Get('saved-searches')
  @ProtectedEndpoint(
    'Get all saved searches',
    'Retrieve all saved searches for the current user',
    SavedSearchListResponseDto,
  )
  async getSavedSearches(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ): Promise<StandardResponse<PaginatedDto<SavedSearchDataDto>>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.searchPreferencesService.getSavedSearches(
          String(user._id),
          query.page,
          query.limit,
        );
      },
      'Get Saved Searches',
      'Saved Searches Retrieved',
      'Saved searches retrieved successfully',
      'Failed to retrieve saved searches',
    );
  }

  /**
   * Get a saved search by ID
   */
  @Get('saved-searches/:id')
  @ProtectedEndpoint(
    'Get a saved search by ID',
    'Retrieve a specific saved search and increment its use count',
    SavedSearchResponseDto,
  )
  async getSavedSearchById(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ): Promise<StandardResponse<SavedSearchDataDto>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.searchPreferencesService.getSavedSearchById(String(user._id), id);
      },
      'Get Saved Search',
      'Saved Search Retrieved',
      'Saved search retrieved successfully',
      'Failed to retrieve saved search',
    );
  }

  /**
   * Update a saved search
   */
  @Put('saved-searches/:id')
  @ProtectedEndpoint(
    'Update a saved search',
    'Update the name, description, or filters of a saved search',
    SavedSearchResponseDto,
  )
  async updateSavedSearch(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
  ): Promise<StandardResponse<SavedSearchDataDto>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.searchPreferencesService.updateSavedSearch(String(user._id), id, dto);
      },
      'Update Saved Search',
      'Saved Search Updated',
      'Saved search updated successfully',
      'Failed to update saved search',
    );
  }

  /**
   * Delete a saved search
   */
  @Delete('saved-searches/:id')
  @HttpCode(HttpStatus.OK)
  @ProtectedEndpoint(
    'Delete a saved search',
    'Soft delete a saved search',
    SavedSearchResponseDto,
  )
  async deleteSavedSearch(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ): Promise<StandardResponse<{ deleted: boolean; id: string }>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.searchPreferencesService.deleteSavedSearch(String(user._id), id);
        return { deleted: true, id };
      },
      'Delete Saved Search',
      'Saved Search Deleted',
      'Saved search deleted successfully',
      'Failed to delete saved search',
    );
  }

  /**
   * Get search history
   */
  @Get('history')
  @ProtectedEndpoint(
    'Get search history',
    'Retrieve recent search history for the current user',
    SearchHistoryListResponseDto,
  )
  async getSearchHistory(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationQueryDto,
  ): Promise<StandardResponse<PaginatedDto<SearchHistoryDataDto>>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.searchPreferencesService.getSearchHistory(
          String(user._id),
          query.page,
          query.limit || 20,
        );
      },
      'Get Search History',
      'Search History Retrieved',
      'Search history retrieved successfully',
      'Failed to retrieve search history',
    );
  }

  /**
   * Clear search history
   */
  @Delete('history')
  @HttpCode(HttpStatus.OK)
  @ProtectedEndpoint(
    'Clear search history',
    'Delete all search history for the current user',
    SearchHistoryListResponseDto,
  )
  async clearSearchHistory(
    @CurrentUser() user: UserDocument,
  ): Promise<StandardResponse<{ cleared: boolean }>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.searchPreferencesService.clearSearchHistory(String(user._id));
        return { cleared: true };
      },
      'Clear Search History',
      'Search History Cleared',
      'Search history cleared successfully',
      'Failed to clear search history',
    );
  }
}
