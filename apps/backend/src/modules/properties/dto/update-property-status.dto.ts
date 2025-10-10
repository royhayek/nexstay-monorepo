import { PropertyStatus } from '../../../common/enums/property.enums';
import { IsEnumField } from '../../../common/validators/standardized-validators';

export class UpdatePropertyStatusDto {
  @IsEnumField(PropertyStatus, { required: true, example: PropertyStatus.PUBLISHED })
  status: PropertyStatus;
}
