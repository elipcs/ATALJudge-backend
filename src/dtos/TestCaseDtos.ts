import { IsString, IsInt, Min, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a test case
 */
export class CreateTestCaseDTO {
  @IsString()
  questionId!: string;

  @IsString()
  input!: string;

  @IsString()
  expectedOutput!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;
}

/**
 * DTO for updating a test case
 */
export class UpdateTestCaseDTO {
  @IsOptional()
  @IsString()
  input?: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;
}

/**
 * DTO for a single test case in bulk operations
 */
export class TestCaseDTO {
  @IsOptional()
  @IsString()
  id?: string; // Se tem ID = update, se não tem = create

  @IsString()
  input!: string;

  @IsString()
  expectedOutput!: string;

  @IsInt()
  @Min(0)
  weight!: number;
}

/**
 * DTO for bulk update of test cases
 * Used in PUT /api/questions/:id/testcases/bulk
 */
export class BulkUpdateTestCasesDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseDTO)
  testCases!: TestCaseDTO[];
}

export class TestCaseResponseDTO {
  id!: string;
  questionId!: string;
  input!: string;
  expectedOutput!: string;
  weight!: number;
  createdAt!: Date;

  constructor(partial: Partial<TestCaseResponseDTO>) {
    Object.assign(this, partial);
  }
}
