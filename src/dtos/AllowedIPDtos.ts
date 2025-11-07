/**
 * Allowed IP Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for managing allowed IP addresses.
 * Used for access control and security policies.
 * 
 * @module dtos/AllowedIPDtos
 */
import { IsString, IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for allowed IP response
 * 
 * @class AllowedIPDTO
 */
export class AllowedIPDTO {
  /** IP address identifier */
  id!: string;
  
  /** IP address string */
  ip!: string;
  
  /** Description of the IP address */
  description!: string;
  
  /** Whether this IP is currently active */
  active!: boolean;
  
  /** Timestamp when the IP was added */
  createdAt!: string;

  constructor(data: any) {
    this.id = data.id;
    this.ip = data.ip;
    this.description = data.description;
    this.active = data.active;
    this.createdAt = data.createdAt instanceof Date 
      ? data.createdAt.toISOString() 
      : data.createdAt;
  }
}

/**
 * DTO for creating an allowed IP
 * 
 * @class CreateAllowedIPDTO
 */
export class CreateAllowedIPDTO {
  /** IP address to allow */
  @IsString({ message: 'IP must be a string' })
  ip!: string;

  /** Description for this IP address */
  @IsString({ message: 'Description must be a string' })
  description!: string;
}

/**
 * DTO for updating an allowed IP
 * 
 * @class UpdateAllowedIPDTO
 */
export class UpdateAllowedIPDTO {
  /** Updated IP address (optional) */
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'Active must be a boolean' })
  active?: boolean;
}
