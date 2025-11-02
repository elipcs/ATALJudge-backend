import { IsUUID, IsNumber, Min, Max, IsOptional } from 'class-validator';

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

export class UpdateGradeDTO {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999.99)
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

