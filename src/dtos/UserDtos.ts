import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../enums';
import { IsStrongPassword, IsValidEmail, IsValidStudentRegistration } from '../utils/validators';

export class UserRegisterDTO {
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  name!: string;

  @IsValidEmail({ message: 'Email must be valid' })
  email!: string;

  @IsString()
  @IsStrongPassword()
  password!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole;

  @IsOptional()
  @IsValidStudentRegistration()
  studentRegistration?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  inviteToken?: string;
}

export class UserLoginDTO {
  @IsValidEmail({ message: 'Email must be valid' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}

export class RefreshTokenDTO {
  @IsString({ message: 'Refresh token must be a string' })
  @MinLength(100, { message: 'Refresh token invalid: incorrect format' })
  refreshToken!: string;
}

export interface UserGrade {
  id: string;
  listId: string;
  listTitle?: string;
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
  @IsValidStudentRegistration()
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

