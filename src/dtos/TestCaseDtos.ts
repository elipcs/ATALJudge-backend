import { IsString, IsBoolean, IsInt, Min, IsOptional, IsUUID } from 'class-validator';

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

