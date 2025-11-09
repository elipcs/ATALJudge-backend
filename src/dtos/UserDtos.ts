/**
 * User Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for user-related operations.
 * Includes validation rules using class-validator decorators.
 * 
 * @module dtos/UserDtos
 */
import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../enums';
import { IsStrongPassword, IsValidEmail } from '../utils/validators';
import { IsValidStudentRegistrationForRole } from '../utils/validators-role';
import { IsValidClassIdForRole } from '../utils/class-validators';

/**
 * DTO for user registration request
 * 
 * @class UserRegisterDTO
 */
export class UserRegisterDTO {
  /** User's full name - minimum 3 characters */
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  name!: string;

  /** User's email address - must be valid format */
  @IsValidEmail({ message: 'Email must be valid' })
  email!: string;

  /** User's password - must meet strength requirements */
  @IsString()
  @IsStrongPassword()
  password!: string;

  /** User's role in the system */
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole;

  /** Student registration number (if applicable) */
  @IsOptional()
  @IsValidStudentRegistrationForRole()
  studentRegistration?: string;

  /** ID of class to join (required for students) */
  @IsOptional()
  @IsValidClassIdForRole()
  classId?: string;

  /** Invite token for registration (if using invite system) */
  @IsOptional()
  @IsString()
  inviteToken?: string;
}

/**
 * DTO for user login request
 * 
 * @class UserLoginDTO
 */
export class UserLoginDTO {
  /** Email address for authentication */
  @IsValidEmail({ message: 'Email must be valid' })
  email!: string;

  /** Password for authentication */
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}

/**
 * DTO for token refresh request
 * 
 * @class RefreshTokenDTO
 */
export class RefreshTokenDTO {
  /** JWT refresh token */
  @IsString({ message: 'Refresh token must be a string' })
  @MinLength(100, { message: 'Refresh token invalid: incorrect format' })
  refreshToken!: string;
}

/**
 * Interface for user grade information
 */
export interface UserGrade {
  id: string;
  questionListId: string;
  questionListTitle?: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserResponseDTO {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
  createdAt!: Date;
  lastLogin?: Date;

  studentRegistration?: string;
  classId?: string;
  className?: string;
  grades?: UserGrade[];

  constructor(partial: Partial<UserResponseDTO>) {
    this.id = partial.id!;
    this.name = partial.name!;
    this.email = partial.email!;
    this.role = partial.role!;
    this.createdAt = partial.createdAt!;
    this.lastLogin = partial.lastLogin;

    if (partial.studentRegistration) {
      this.studentRegistration = partial.studentRegistration;
    }
    
    if ((partial as any).class) {
      this.classId = (partial as any).class.id;
      this.className = (partial as any).class.name;
    } else {
      if (partial.classId) {
        this.classId = partial.classId;
      }
      
      if (partial.className) {
        this.className = partial.className;
      }
    }

    if (partial.grades) {
      this.grades = partial.grades;
    }
  }
}

export class UpdateProfileDTO {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsValidEmail()
  email?: string;

  @IsOptional()
  @IsValidStudentRegistrationForRole()
  studentRegistration?: string;
}

export class ChangePasswordDTO {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword!: string;

  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}

export class RequestPasswordResetDTO {
  @IsValidEmail({ message: 'Email must be valid' })
  email!: string;
}

export class ResetPasswordDTO {
  @IsString({ message: 'Token is required' })
  token!: string;

  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}

