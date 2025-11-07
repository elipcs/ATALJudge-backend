/**
 * Invite Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for user invitation operations.
 * Manages class invitations with role assignment and usage limits.
 * 
 * @module dtos/InviteDtos
 */
import { IsEnum, IsOptional, IsUUID, IsInt, Min, IsString } from 'class-validator';
import { UserRole } from '../enums';

/**
 * DTO for creating an invitation
 * 
 * @class CreateInviteDTO
 */
export class CreateInviteDTO {
  /** Role assigned to users who accept the invitation */
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role!: UserRole;

  /** Maximum number of times this invitation can be used */
  @IsInt({ message: 'Maximum number of uses must be an integer' })
  @Min(1, { message: 'Maximum number of uses must be at least 1' })
  maxUses!: number;

  /** Number of days before invitation expires */
  @IsInt({ message: 'Expiration days must be an integer' })
  @Min(1, { message: 'Expiration days must be at least 1' })
  expirationDays!: number;

  /** Class ID for the invitation (optional) */
  @IsOptional()
  @IsUUID('4', { message: 'Class ID must be a valid UUID' })
  classId?: string;

  /** Class name for reference */
  @IsOptional()
  @IsString({ message: 'Class name must be a string' })
  className?: string;

  /** ID of the user creating the invitation */
  @IsString({ message: 'Creator ID is required' })
  createdBy!: string;

  /** Name of the user creating the invitation */
  @IsString({ message: 'Creator name is required' })
  creatorName!: string;
}

export class InviteResponseDTO {
  id!: string;
  role!: UserRole;
  token!: string;
  link!: string;
  maxUses!: number;
  currentUses!: number;
  classId?: string;
  className?: string;
  createdById?: string;
  creatorName?: string;
  expiresAt!: Date;
  isUsed!: boolean;
  usedAt?: Date;
  createdAt!: Date;

  constructor(partial: Partial<InviteResponseDTO>) {
    Object.assign(this, partial);
  }
}

