/**
 * Submission Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for code submission operations.
 * Includes validation rules for submission-related operations.
 * 
 * @module dtos/SubmissionDtos
 */
import { IsString, IsUUID, IsEnum, MinLength } from 'class-validator';
import { ProgrammingLanguage, SubmissionStatus, JudgeVerdict } from '../enums';

/**
 * DTO for creating a new code submission
 * 
 * @class CreateSubmissionDTO
 */
export class CreateSubmissionDTO {
  /** UUID of the question being solved */
  @IsUUID('4', { message: 'Question ID must be a valid UUID' })
  questionId!: string;

  /** Source code to be submitted */
  @IsString()
  @MinLength(1, { message: 'Code cannot be empty' })
  code!: string;

  /** Programming language used in the submission */
  @IsEnum(ProgrammingLanguage, { message: 'Invalid programming language' })
  language!: ProgrammingLanguage;
}

/**
 * DTO for submission response data
 * 
 * Contains submission details including status, results, and execution metrics.
 * 
 * @class SubmissionResponseDTO
 */
export class SubmissionResponseDTO {
  id!: string;
  userId!: string;
  questionId!: string;
  code!: string;
  language!: ProgrammingLanguage;
  status!: SubmissionStatus;
  score!: number;
  totalTests!: number;
  passedTests!: number;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  verdict?: string;
  errorMessage?: string;
  createdAt!: Date;
  updatedAt!: Date;
  userName?: string;
  userEmail?: string;
  studentRegistration?: string;
  questionName?: string;
  questionListId?: string;
  questionListTitle?: string;

  constructor(partial: Partial<SubmissionResponseDTO>) {
    Object.assign(this, partial);
  }
}

export class TestCaseResultDTO {
  testCaseId!: string;
  verdict!: JudgeVerdict;
  passed!: boolean;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  actualOutput?: string;
  errorMessage?: string;

  constructor(partial: Partial<TestCaseResultDTO>) {
    Object.assign(this, partial);
  }
}

export class SubmissionDetailDTO {
  id!: string;
  userId!: string;
  questionId!: string;
  code!: string;
  language!: ProgrammingLanguage;
  status!: SubmissionStatus;
  score!: number;
  totalTests!: number;
  passedTests!: number;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  verdict?: string;
  errorMessage?: string;
  createdAt!: Date;
  updatedAt!: Date;
  questionName?: string;
  questionListId?: string;
  questionListTitle?: string;

  testResults!: TestCaseResultDTO[];

  constructor(partial: Partial<SubmissionDetailDTO>) {
    Object.assign(this, partial);
  }
}

