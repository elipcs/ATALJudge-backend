import { IsString, IsBoolean, IsInt, Min, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO para criação de caso de teste
 */
export class CreateTestCaseDTO {
  @IsUUID('4')
  questionId!: string;

  @IsString()
  input!: string;

  @IsString()
  expectedOutput!: string;

  @IsOptional()
  @IsBoolean()
  isSample?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;
}

/**
 * DTO para atualização de caso de teste
 */
export class UpdateTestCaseDTO {
  @IsOptional()
  @IsString()
  input?: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @IsOptional()
  @IsBoolean()
  isSample?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;
}

/**
 * DTO de resposta de caso de teste
 */
export class TestCaseResponseDTO {
  id!: string;
  questionId!: string;
  input!: string;
  expectedOutput!: string;
  isSample!: boolean;
  weight!: number;
  createdAt!: Date;

  constructor(partial: Partial<TestCaseResponseDTO>) {
    Object.assign(this, partial);
  }
}

