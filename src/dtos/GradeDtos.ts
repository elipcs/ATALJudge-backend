import { IsUUID, IsOptional } from 'class-validator';
import { IsValidScore } from '../utils/validators';

export class CreateGradeDTO {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  listId!: string;

  @IsValidScore()
  score!: number;
}

export class UpdateGradeDTO {
  @IsOptional()
  @IsValidScore()
  score?: number;
}

export class GradeResponseDTO {
  id!: string;
  studentId!: string;
  listId!: string;
  score!: number;
  createdAt!: Date;
  updatedAt!: Date;

  studentName?: string;
  listTitle?: string;

  constructor(partial: Partial<GradeResponseDTO>) {
    Object.assign(this, partial);
  }
}

