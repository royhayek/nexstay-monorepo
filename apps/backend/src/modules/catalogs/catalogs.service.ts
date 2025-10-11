import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogVersionDocument } from '../../database/schemas/catalog-version.schema';
import { EnumDisplaysService } from '../enum-displays/enum-displays.service';
import { AmenityCategoriesService } from '../amenity-categories/amenity-categories.service';

@Injectable()
export class CatalogsService {
  constructor(
    @InjectModel('CatalogVersion')
    private readonly catalogVersionModel: Model<CatalogVersionDocument>,
    private readonly enumDisplaysService: EnumDisplaysService,
    private readonly amenityCategoriesService: AmenityCategoriesService,
  ) {}

  async getCatalogs(includes: string[], locale: string) {
    const result: Record<string, unknown> = {};

    // If no includes specified, return all catalogs
    if (includes.length === 0) {
      const allEnumDisplays = await this.enumDisplaysService.findAllForFrontend();
      result.enumDisplays = allEnumDisplays;
      result.amenityCategories = await this.amenityCategoriesService.findAllForFrontend();
      return result;
    }

    // Get all enum displays once if any enum-based catalog is requested
    const needsEnumDisplays = includes.some((inc) =>
      [
        'enumdisplays',
        'currencies',
        'bedtypes',
        'propertytypes',
        'roomtypes',
        'cancellationpolicies',
        'notificationtypes',
        'paymentproviders',
      ].includes(inc.toLowerCase()),
    );

    let allEnumDisplays: Record<string, unknown[]> | null = null;
    if (needsEnumDisplays) {
      allEnumDisplays = await this.enumDisplaysService.findAllForFrontend();
    }

    for (const include of includes) {
      switch (include.toLowerCase()) {
        case 'enumdisplays':
          result.enumDisplays = allEnumDisplays;
          break;
        case 'amenitycategories':
          result.amenityCategories = await this.amenityCategoriesService.findAllForFrontend();
          break;
        case 'currencies':
          result.currencies = allEnumDisplays?.['currency'] || [];
          break;
        case 'bedtypes':
          result.bedTypes = allEnumDisplays?.['bedType'] || [];
          break;
        case 'propertytypes':
          result.propertyTypes = allEnumDisplays?.['propertyType'] || [];
          break;
        case 'roomtypes':
          result.roomTypes = allEnumDisplays?.['roomType'] || [];
          break;
        case 'cancellationpolicies':
          result.cancellationPolicies = allEnumDisplays?.['cancellationPolicy'] || [];
          break;
        case 'notificationtypes':
          result.notificationTypes = allEnumDisplays?.['notificationType'] || [];
          break;
        case 'paymentproviders':
          result.paymentProviders = allEnumDisplays?.['paymentProvider'] || [];
          break;
        case 'amenities':
          // Amenities need to be implemented separately if needed
          result.amenities = [];
          break;
      }
    }

    return result;
  }

  async getCatalogVersion() {
    const version = await this.catalogVersionModel
      .findOne({ id: 'default' })
      .select('version updatedAt')
      .exec();

    return {
      version: version?.version || 1,
      lastModified: version?.updatedAt || new Date(),
    };
  }
}
