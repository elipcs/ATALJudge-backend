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

  /** Problem statement/description */
  @IsString()
  @MinLength(10, { message: 'Statement must be at least 10 characters' })
  statement!: string;

  /** Input format specification */
  @IsOptional()
  @IsString()
  inputFormat?: string;

  /** Output format specification */
  @IsOptional()
  @IsString()
  outputFormat?: string;

  @IsOptional()
  @IsString()
  constraints?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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

  @IsString()
  @MinLength(1, { message: 'Question list ID is required' })
  questionListId!: string;
}

/**
 * DTO for updating question main content (part 1)
 * Includes: title, statement, examples, time/memory limits, etc.
 */
export abstract class UpdateQuestionDTO {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  statement?: string;

  @IsOptional()
  @IsString()
  inputFormat?: string;

  @IsOptional()
  @IsString()
  outputFormat?: string;

  @IsOptional()
  @IsString()
  constraints?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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
}

/**
 * DTO for updating Codeforces-specific fields (part 2)
 * Used for PUT /api/questions/:id/codeforces
 */
export class UpdateCodeforcesFieldsDTO {
  @IsOptional()
  @IsString()
  codeforcesContestId?: string;

  @IsOptional()
  @IsString()
  codeforcesProblemIndex?: string;

  @IsOptional()
  @IsString()
  codeforcesLink?: string;
}

export class QuestionResponseDTO {
  id!: string;
  title!: string;
  statement!: string;
  inputFormat!: string;
  outputFormat!: string;
  constraints!: string;
  notes!: string;
  tags!: string[];
  timeLimitMs!: number;
  memoryLimitKb!: number;
  examples!: QuestionExample[];
  judgeType!: JudgeType;
  submissionType?: 'local' | 'codeforces';
  codeforcesContestId?: string;
  codeforcesProblemIndex?: string;
  codeforcesLink?: string;
  authorId?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<QuestionResponseDTO>) {
    Object.assign(this, partial);
  }
}

