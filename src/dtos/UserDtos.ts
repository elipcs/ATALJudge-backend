import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../enums';
import { IsStrongPassword } from '../utils/validators';

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

  @IsOptional()
  @IsString()
  inviteToken?: string;
}

export class UserLoginDTO {
  @IsEmail({}, { message: 'Email deve ser válido' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Senha é obrigatória' })
  password!: string;
}

export class RefreshTokenDTO {
  @IsString({ message: 'Refresh token deve ser uma string' })
  @MinLength(100, { message: 'Refresh token inválido: formato incorreto' })
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
    
    // Se partial tem class (relação carregada), usar os dados da classe
    if ((partial as any).class) {
      this.classId = (partial as any).class.id;
      this.className = (partial as any).class.name;
    } else {
      // Caso contrário, usar classId e className se fornecidos diretamente
      if (partial.classId) {
        this.classId = partial.classId;
      }
      
      if (partial.className) {
        this.className = partial.className;
      }
    }

    // Incluir grades se existirem
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
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  studentRegistration?: string;
}

export class ChangePasswordDTO {
  @IsString()
  @MinLength(1, { message: 'Senha atual é obrigatória' })
  currentPassword!: string;

  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}

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

export class RequestPasswordResetDTO {
  @IsEmail({}, { message: 'Email deve ser válido' })
  email!: string;
}

export class ResetPasswordDTO {
  @IsString({ message: 'Token é obrigatório' })
  token!: string;

  @IsString()
  @IsStrongPassword()
  newPassword!: string;
}

