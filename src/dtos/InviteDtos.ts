import { IsEnum, IsOptional, IsUUID, IsInt, Min, IsString } from 'class-validator';
import { UserRole } from '../enums';

/**
 * DTO para criação de convite
 */
export class CreateInviteDTO {
  @IsEnum(UserRole, { message: 'Papel de usuário inválido' })
  role!: UserRole;

  @IsInt({ message: 'Número máximo de usos deve ser um inteiro' })
  @Min(1, { message: 'Número máximo de usos deve ser pelo menos 1' })
  maxUses!: number;

  @IsInt({ message: 'Dias de expiração deve ser um inteiro' })
  @Min(1, { message: 'Dias de expiração deve ser pelo menos 1' })
  expirationDays!: number;

  @IsOptional()
  @IsUUID('4', { message: 'ID da turma deve ser um UUID válido' })
  classId?: string;

  @IsOptional()
  @IsString({ message: 'Nome da turma deve ser uma string' })
  className?: string;

  @IsString({ message: 'ID do criador é obrigatório' })
  createdBy!: string;

  @IsString({ message: 'Nome do criador é obrigatório' })
  creatorName!: string;
}

/**
 * DTO de resposta de convite
 */
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

