export enum PropertyType {
  APARTMENT = 'Apartment',
  HOUSE = 'House',
  TOWNHOUSE = 'Townhouse',
  CONDOMINIUM = 'Condominium',
  VILLA = 'Villa',
  LOFT = 'Loft',
  CABIN = 'Cabin',
  COTTAGE = 'Cottage',
  BUNGALOW = 'Bungalow',
  CASTLE = 'Castle',
  TREEHOUSE = 'Treehouse',
  BOAT = 'Boat',
  CAMPER_RV = 'Camper/RV',
  TENT = 'Tent',
  HOTEL = 'Hotel',
  HOSTEL = 'Hostel',
  BED_BREAKFAST = 'Bed & Breakfast',
  BOUTIQUE_HOTEL = 'Boutique hotel',
  GUESTHOUSE = 'Guesthouse',
  GUEST_SUITE = 'Guest suite',
  SERVICED_APARTMENT = 'Serviced apartment',
  STUDIO = 'Studio',
  PENTHOUSE = 'Penthouse',
  DUPLEX = 'Duplex',
  FARMHOUSE = 'Farmhouse',
  CHALET = 'Chalet',
  TINY_HOUSE = 'Tiny House',
  HOUSEBOAT = 'Houseboat',
  RESORT = 'Resort',
  INN = 'Inn',
  LODGE = 'Lodge',
  VACATION_HOME = 'Vacation Home',
  BEACH_HOUSE = 'Beach House',
  YURT = 'Yurt',
  SAFARI_TENT = 'Safari Tent',
  BARN = 'Barn',
  OTHER = 'Other',
}

export enum RoomType {
  ENTIRE_HOME = 'Entire home/apt',
  PRIVATE_ROOM = 'Private room',
  SHARED_ROOM = 'Shared room',
  HOTEL_ROOM = 'Hotel room',
  SHARED_SPACE = 'Shared space',
  ENTIRE_PLACE = 'Entire place',
}

export enum BedType {
  SINGLE = 'Single bed',
  TWIN = 'Twin bed',
  FULL_DOUBLE = 'Full/Double bed',
  QUEEN = 'Queen bed',
  KING = 'King bed',
  SUPER_KING = 'Super King bed',
  SOFA_BED = 'Sofa bed',
  FUTON = 'Futon',
  MURPHY_BED = 'Murphy bed',
  BUNK_BED = 'Bunk bed',
  HAMMOCK = 'Hammock',
  FLOOR_MATTRESS = 'Floor mattress',
}

export enum CancellationPolicy {
  FLEXIBLE = 'flexible',
  MODERATE = 'moderate',
  STRICT = 'strict',
  STRICT_14_WITH_GRACE_PERIOD = 'strict_14_with_grace_period',
  SUPER_STRICT_30 = 'super_strict_30',
  SUPER_STRICT_60 = 'super_strict_60',
}

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
