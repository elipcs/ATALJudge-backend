import { IsUUID, IsNumber, Min, Max, IsOptional } from 'class-validator';

/**
 * DTO para criação de nota
 */
export class CreateGradeDTO {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  listId!: string;

  @IsNumber()
  @Min(0)
  @Max(999.99)
  score!: number;
}

/**
 * DTO para atualização de nota
 */
export class UpdateGradeDTO {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999.99)
  score?: number;
}

/**
 * DTO de resposta de nota
 */
export class GradeResponseDTO {
  id!: string;
  studentId!: string;
  listId!: string;
  score!: number;
  createdAt!: Date;
  updatedAt!: Date;

  // Dados relacionados (opcionais)
  studentName?: string;
  listTitle?: string;

  constructor(partial: Partial<GradeResponseDTO>) {
    Object.assign(this, partial);
  }
}

