/**
 * Test Case Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for test case management.
 * Test cases are used to validate code submissions against expected outputs.
 * 
 * @module dtos/TestCaseDtos
 */
import { IsString, IsBoolean, IsInt, Min, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for creating a test case
 * 
 * @class CreateTestCaseDTO
 */
export class CreateTestCaseDTO {
  /** UUID of the question this test case belongs to */
  @IsUUID('4')
  questionId!: string;

  /** Input data for the test case */
  @IsString()
  input!: string;

  /** Expected output for this test case */
  @IsString()
  expectedOutput!: string;

  /** Whether this is a sample test case shown to users */
  @IsOptional()
  @IsBoolean()
  isSample?: boolean;

  /** Weight/importance of this test case in scoring */
  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;
}

/**
 * DTO for updating a test case
 * 
 * @class UpdateTestCaseDTO
 */
export class UpdateTestCaseDTO {
  /** Updated input (optional) */
  @IsOptional()
  @IsString()
  input?: string;

  /** Updated expected output (optional) */
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

