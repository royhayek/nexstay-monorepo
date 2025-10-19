/**
 * NOTE: PropertyType, RoomType, BedType, and CancellationPolicy have been migrated
 * to the database-driven catalog system. These values are now managed through the
 * catalog service and stored in the catalog_items collection.
 *
 * To get these values, use the CatalogService:
 * - catalogService.findAllForFrontend(['PropertyType', 'RoomType', 'BedType', 'CancellationPolicy'])
 *
 * Validation is done using @IsCatalogField() decorator instead of @IsEnumField()
 */

export enum ReviewType {
  GUEST_TO_HOST = 'guest_to_host',
  HOST_TO_GUEST = 'host_to_guest',
}

export enum PropertyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DELETED = 'deleted',
  SUSPENDED = 'suspended',
  ALL = 'all',
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PropertyCategory {
  BEACHFRONT = 'beachfront',
  LAKEFRONT = 'lakefront',
  MOUNTAIN = 'mountain',
  COUNTRYSIDE = 'countryside',
  CITY_CENTER = 'city_center',
  CABINS = 'cabins',
  LUXURY = 'luxury',
  UNIQUE_STAYS = 'unique_stays',
  TREEHOUSES = 'treehouses',
  HISTORIC_HOMES = 'historic_homes',
  POOLS = 'pools',
  DESIGN = 'design',
  TROPICAL = 'tropical',
  SKIING = 'skiing',
  ISLANDS = 'islands',
  VINEYARDS = 'vineyards',
  FARMS = 'farms',
  TINY_HOMES = 'tiny_homes',
  CAVES = 'caves',
  CASTLES = 'castles',
}

export enum FlexibleDateRange {
  WEEKEND = 'weekend', // Next weekend (Friday-Sunday)
  WEEK = 'week', // 7 days starting from today
  MONTH = 'month', // 30 days starting from today
  THREE_DAYS = '3_days', // 3 days starting from today
  LONG_WEEKEND = 'long_weekend', // 3-4 days (Thursday-Sunday or Friday-Monday)
  TWO_WEEKS = '2_weeks', // 14 days starting from today
}

export enum ViewType {
  OCEAN_VIEW = 'ocean_view',
  MOUNTAIN_VIEW = 'mountain_view',
  LAKE_VIEW = 'lake_view',
  CITY_VIEW = 'city_view',
  GARDEN_VIEW = 'garden_view',
  POOL_VIEW = 'pool_view',
  RIVER_VIEW = 'river_view',
  GOLF_COURSE_VIEW = 'golf_course_view',
  NO_VIEW = 'no_view',
  PARTIAL_VIEW = 'partial_view',
}

export enum ParkingType {
  FREE_PARKING = 'free_parking',
  PAID_PARKING = 'paid_parking',
  STREET_PARKING = 'street_parking',
  GARAGE = 'garage',
  VALET = 'valet',
  RESERVED_SPOT = 'reserved_spot',
  EV_CHARGING = 'ev_charging',
  NO_PARKING = 'no_parking',
}

export enum CheckInMethod {
  SELF_CHECK_IN = 'self_check_in',
  KEYPAD = 'keypad',
  LOCKBOX = 'lockbox',
  SMART_LOCK = 'smart_lock',
  DOORMAN = 'doorman',
  HOST_GREETING = 'host_greeting',
  FRONT_DESK = 'front_desk',
  BUILDING_STAFF = 'building_staff',
}
