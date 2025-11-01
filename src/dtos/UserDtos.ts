import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../enums';
import { IsStrongPassword } from '../utils/validators';

/**
 * DTO para registro de usuário
 */
export class UserRegisterDTO {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  name!: string;

  @IsEmail({}, { message: 'Email deve ser válido' })
  email!: string;

  @IsString()
  @IsStrongPassword()
  password!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Papel de usuário inválido' })
  role?: UserRole;

  @IsOptional()
  @IsString()
  studentRegistration?: string;

  @IsOptional()
  @IsString()
  classId?: string;
}

/**
 * DTO para login de usuário
 */
export class UserLoginDTO {
  @IsEmail({}, { message: 'Email deve ser válido' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Senha é obrigatória' })
  password!: string;
}

/**
 * DTO para refresh token
 */
export class RefreshTokenDTO {
  @IsString({ message: 'Refresh token deve ser uma string' })
  @MinLength(100, { message: 'Refresh token inválido: formato incorreto' })
  refreshToken!: string;
}

/**
 * DTO de resposta de usuário 
 */
export class UserResponseDTO {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
  createdAt!: Date;
  lastLogin?: Date;
  
  // Campos específicos de Student
  studentRegistration?: string;

  constructor(partial: Partial<UserResponseDTO>) {
    this.id = partial.id!;
    this.name = partial.name!;
    this.email = partial.email!;
    this.role = partial.role!;
    this.createdAt = partial.createdAt!;
    this.lastLogin = partial.lastLogin;
    
    // Incluir studentRegistration se for Student
    if (partial.studentRegistration) {
      this.studentRegistration = partial.studentRegistration;
    }
  }
}

/**
 * DTO para atualização de perfil
 */
export class UpdateProfileDTO {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

/**
 * DTO para alteração de senha
 */
export class ChangePasswordDTO {
  @IsString()
  @MinLength(1, { message: 'Senha atual é obrigatória' })
  currentPassword!: string;

  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}

/**
 * DTO para criação de usuário (admin)
 */
export class CreateUserDTO {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsStrongPassword()
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

/**
 * DTO para solicitar reset de senha
 */
export class RequestPasswordResetDTO {
  @IsEmail({}, { message: 'Email deve ser válido' })
  email!: string;
}

/**
 * DTO para confirmar reset de senha
 */
export class ResetPasswordDTO {
  @IsString({ message: 'Token é obrigatório' })
  token!: string;

  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}

