/**
 * Question Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for question-related operations.
 * Supports different question types (programming problems, multiple choice, etc).
 * 
 * @module dtos/QuestionDtos
 */
import { IsString, MinLength, IsInt, Min, Max, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsString()
  @MinLength(1, { message: 'Question list ID must be valid if provided' })
  questionListId?: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionExampleDTO)
  examples?: QuestionExampleDTO[];

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

export class QuestionResponseDTO {
  id!: string;
  title!: string;
  text!: string;
  timeLimitMs!: number;
  memoryLimitKb!: number;
  examples!: QuestionExample[];
  oracleCode?: string;
  oracleLanguage?: string;
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
