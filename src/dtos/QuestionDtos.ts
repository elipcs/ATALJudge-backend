/**
 * Question Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for question-related operations.
 * Supports different question types (programming problems, multiple choice, etc).
 * 
 * @module dtos/QuestionDtos
 */
import { IsString, MinLength, IsInt, Min, Max, IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JudgeType } from '../enums';
import { QuestionExample } from '../models/Question';

/**
 * DTO for question example (input/output pair)
 * 
 * @class QuestionExampleDTO
 */
export class QuestionExampleDTO {
  /** Example input for the problem */
  @IsString()
  input!: string;

  /** Expected output for the example */
  @IsString()
  output!: string;
}

/**
 * Abstract base DTO for creating questions
 * 
 * @abstract
 * @class CreateQuestionDTO
 */
export abstract class CreateQuestionDTO {
  /** Question title/name */
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  title!: string;

  /** Question text/content */
  @IsString()
  @MinLength(10, { message: 'Text must be at least 10 characters' })
  text!: string;

  @IsInt()
  @Min(100)
  @Max(30000)
  timeLimitMs!: number;

  @IsInt()
  @Min(1000)
  @Max(512000)
  memoryLimitKb!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionExampleDTO)
  examples?: QuestionExampleDTO[];

  @IsOptional()
  @IsEnum(JudgeType)
  judgeType?: JudgeType;

  @IsOptional()
  @IsString()
  submissionType?: 'local' | 'codeforces';

  /** Codeforces Contest ID (required if submissionType is 'codeforces') */
  @IsOptional()
  @IsString()
  contestId?: string;

  /** Codeforces Problem Index (e.g., 'A', 'B', 'C1') (required if submissionType is 'codeforces') */
  @IsOptional()
  @IsString()
  problemIndex?: string;

  @IsString()
  @MinLength(1, { message: 'Question list ID is required' })
  questionListId!: string;

  @IsOptional()
  @IsString()
  source?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] | null;
}

/**
 * DTO for updating question main content (part 1)
 * Includes: title, statement, examples, time/memory limits, submission type
 * 
 * NOTE: Codeforces fields (contestId, problemIndex) should be updated
 * using the separate endpoint: PUT /api/questions/:id/codeforces
 */
export abstract class UpdateQuestionDTO {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(30000)
  timeLimitMs?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(512000)
  memoryLimitKb?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  wallTimeLimitSeconds?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionExampleDTO)
  examples?: QuestionExampleDTO[];

  /** Update submission type ('local' or 'codeforces') */
  @IsOptional()
  @IsString()
  submissionType?: 'local' | 'codeforces';

  /** Oracle code for test case generation */
  @IsOptional()
  @IsString()
  oracleCode?: string;

  /** Oracle code language (e.g., 'python', 'java') */
  @IsOptional()
  @IsString()
  oracleLanguage?: string;

  @IsOptional()
  @IsString()
  source?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] | null;
}

/**
 * DTO for updating Codeforces-specific fields (part 2 of question editing)
 * Used for PUT /api/questions/:id/codeforces
 * 
 * This is a SEPARATE endpoint from PUT /api/questions/:id
 * Used specifically for managing Codeforces integration fields
 */
export class UpdateCodeforcesFieldsDTO {
  @IsOptional()
  @IsString()
  contestId?: string;

  @IsOptional()
  @IsString()
  problemIndex?: string;
}

export class QuestionResponseDTO {
  id!: string;
  title!: string;
  text!: string;
  timeLimitMs!: number;
  memoryLimitKb!: number;
  examples!: QuestionExample[];
  judgeType!: JudgeType;
  submissionType?: 'local' | 'codeforces';
  contestId?: string;
  problemIndex?: string;
  oracleCode?: string;
  oracleLanguage?: string;
  authorId?: string;
  source?: string;
  tags!: string[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<QuestionResponseDTO>) {
    Object.assign(this, partial);
  }
}

export class PaginatedQuestionResponseDTO {
  questions!: QuestionResponseDTO[];
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
