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
  OTHER = 'Other',
}

export enum RoomType {
  ENTIRE_HOME = 'Entire home/apt',
  PRIVATE_ROOM = 'Private room',
  SHARED_ROOM = 'Shared room',
  HOTEL_ROOM = 'Hotel room',
}

export enum BedType {
  REAL_BED = 'Real Bed',
  PULL_OUT_SOFA = 'Pull-out Sofa',
  FUTON = 'Futon',
  COUCH = 'Couch',
  AIRBED = 'Airbed',
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
