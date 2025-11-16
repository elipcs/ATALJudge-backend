/**
 * @module dtos/TestCaseGeneratorDtos
 * @description DTOs for test case generation requests
 */
import { IsString, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ProgrammingLanguage } from '../enums/ProgrammingLanguage';

export type AlgorithmType = 
  | 'backtracking'
  | 'graph'
  | 'divide-conquer'
  | 'brute-force'
  | 'greedy'
  | 'dynamic-programming'
  | 'math'
  | 'string'
  | 'default';

/**
 * DTO for generating test cases
 */
export class GenerateTestCasesDTO {
  @IsString()
  oracleCode!: string;

  @IsEnum(ProgrammingLanguage)
  language!: ProgrammingLanguage;

  @IsInt()
  @Min(1)
  @Max(200)
  count!: number;

  @IsString()
  @IsOptional()
  algorithmType?: AlgorithmType;
}

/**
 * Response DTO for generated test cases
 */
export class GeneratedTestCaseDTO {
  input!: string;
  expectedOutput!: string;
}

export class GenerateTestCasesResponseDTO {
  testCases!: GeneratedTestCaseDTO[];
  totalGenerated!: number;
  algorithmTypeDetected?: string;
}







