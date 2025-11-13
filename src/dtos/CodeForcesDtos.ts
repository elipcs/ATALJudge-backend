/**
 * Codeforces Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for Codeforces integration.
 * Used for submitting problems and retrieving results from Codeforces API.
 * 
 * @module dtos/CodeForcesDtos
 */

import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ProgrammingLanguage } from '../enums';

/**
 * DTO for submitting a problem to Codeforces
 * 
 * @class SubmitCodeForcesProblemDTO
 */
export class SubmitCodeForcesProblemDTO {
  /** Contest ID (e.g., "1") */
  @IsString()
  contestId!: string;

  /** Problem ID (e.g., "A", "B", "C") */
  @IsString()
  problemId!: string;

  /** Source code */
  @IsString()
  sourceCode!: string;

  /** Programming language */
  @IsEnum(ProgrammingLanguage)
  language!: ProgrammingLanguage;

  /** Standard input for testing */
  @IsOptional()
  @IsString()
  stdin?: string;

  /** Expected output for verification */
  @IsOptional()
  @IsString()
  expectedOutput?: string;

  /** Time limit in seconds */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  timeLimitSeconds?: number;

  /** Memory limit in MB */
  @IsOptional()
  @IsInt()
  @Min(32)
  @Max(1024)
  memoryLimitMB?: number;
}

/**
 * DTO for Codeforces submission response
 * 
 * Contains submission details and execution results.
 * 
 * @class CodeForcesSubmissionResponseDTO
 */
export class CodeForcesSubmissionResponseDTO {
  /** Submission ID from Codeforces */
  @IsString()
  submissionId!: string;

  /** Verdict result (Accepted, Wrong Answer, etc.) */
  @IsString()
  verdict!: string;

  /** Execution time in milliseconds */
  @IsOptional()
  @IsInt()
  @Min(0)
  executionTimeMs?: number;

  /** Memory used in KB */
  @IsOptional()
  @IsInt()
  @Min(0)
  memoryUsedKb?: number;

  /** Program output */
  @IsOptional()
  @IsString()
  output?: string;

  /** Error message if submission failed */
  @IsOptional()
  @IsString()
  errorMessage?: string;

  /** Whether submission passed all test cases */
  @IsOptional()
  passed?: boolean;
}

/**
 * DTO for batch submission to Codeforces
 * 
 * @class BatchSubmitCodeForcesDTO
 */
export class BatchSubmitCodeForcesDTO {
  /** Array of problem submissions */
  submissions!: SubmitCodeForcesProblemDTO[];
}

/**
 * DTO for fetching Codeforces problem details
 * 
 * @class CodeForcesProblemDTO
 */
export class CodeForcesProblemDTO {
  /** Contest ID */
  @IsString()
  contestId!: string;

  /** Problem ID */
  @IsString()
  problemId!: string;

  /** Problem title */
  @IsOptional()
  @IsString()
  title?: string;

  /** Problem time limit */
  @IsOptional()
  @IsInt()
  timeLimitMillis?: number;

  /** Problem memory limit */
  @IsOptional()
  @IsInt()
  memoryLimitMB?: number;

  /** Problem input format */
  @IsOptional()
  @IsString()
  inputFormat?: string;

  /** Problem output format */
  @IsOptional()
  @IsString()
  outputFormat?: string;
}
