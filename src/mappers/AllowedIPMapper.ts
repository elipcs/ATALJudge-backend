/**
 * Allowed IP Data Mapper
 * 
 * Maps between AllowedIP domain models and DTOs.
 * Handles conversion of AllowedIP entities to data transfer objects for API responses.
 * 
 * @module mappers/AllowedIPMapper
 */
import { AllowedIP } from '../models/AllowedIP';
import { AllowedIPDTO } from '../dtos/AllowedIPDtos';

/**
 * Allowed IP Mapper Class
 * 
 * Provides static methods for converting between AllowedIP domain objects and DTOs.
 * 
 * @class AllowedIPMapper
 */
export class AllowedIPMapper {
  /**
   * Converts an AllowedIP domain model to AllowedIPDTO
   * 
   * @static
   * @param {AllowedIP} allowedIP - The allowed IP domain model
   * @returns {AllowedIPDTO} The allowed IP data transfer object
   */
  static toDTO(allowedIP: AllowedIP): AllowedIPDTO {
    return new AllowedIPDTO(allowedIP);
  }
}
