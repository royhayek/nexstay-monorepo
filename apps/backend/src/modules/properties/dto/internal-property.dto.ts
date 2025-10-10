import { CreatePropertyDto } from './create-property.dto';

/**
 * Internal DTO for property creation that includes system-generated fields
 * This extends the user-provided CreatePropertyDto with internal fields
 */
export interface InternalCreatePropertyDto extends CreatePropertyDto {
  /**
   * Property owner ID - set from authenticated user
   * This field is not part of user input but added internally
   */
  ownerId: string;

  /**
   * Price per night - automatically set from price.pricePerNight
   * This field is required by the schema but generated internally
   */
  pricePerNight: number;
}
