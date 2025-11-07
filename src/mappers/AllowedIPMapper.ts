import { AllowedIP } from '../models/AllowedIP';
import { AllowedIPDTO } from '../dtos/AllowedIPDtos';

export class AllowedIPMapper {
  static toDTO(allowedIP: AllowedIP): AllowedIPDTO {
    return new AllowedIPDTO(allowedIP);
  }
}
