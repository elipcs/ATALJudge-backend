/**
 * Question List Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for question list (problem sets) management.
 * Question lists group multiple questions with scoring and grading configurations.
 * 
 * @module dtos/QuestionListDtos
 */
import { IsString, IsOptional, IsArray, IsEnum, IsInt, Min, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a question group within a list
 * 
 * Groups questions together with optional weighting and percentage distribution.
 * 
 * @class QuestionGroupDTO
 */
export class QuestionGroupDTO {
  /** Group identifier */
  @IsString()
  id!: string;

  /** Group name/title */
  @IsString()
  name!: string;

  /** Array of question IDs in this group */
  @IsArray()
  @IsString({ each: true })
  questionIds!: string[];

  /** Weight assigned to this group */
  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;

  /** Percentage distribution for grading */
  @IsOptional()
  @IsInt()
  @Min(0)
  percentage?: number;
}

/**
 * DTO for creating a question list
 * 
 * @class CreateQuestionListDTO
 */
export class CreateQuestionListDTO {
  /** List title/name */
  @IsString()
  title!: string;

  /** List description */
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['simple', 'groups'])
  scoringMode?: 'simple' | 'groups';

  @IsOptional()
  @IsInt()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minQuestionsForMaxScore?: number;

  @IsOptional()
  @IsBoolean()
  isRestricted?: boolean;

  @IsOptional()
  @IsBoolean()
  countTowardScore?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true})
  classIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionGroupDTO)
  questionGroups?: QuestionGroupDTO[];
}

export class UpdateQuestionListDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @IsOptional()
  @IsBoolean()
  isRestricted?: boolean;

  @IsOptional()
  @IsBoolean()
  countTowardScore?: boolean;
}

export class UpdateQuestionListScoringDTO {
  @IsOptional()
  @IsEnum(['simple', 'groups'])
  scoringMode?: 'simple' | 'groups';

  @IsOptional()
  @IsInt()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minQuestionsForMaxScore?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionGroupDTO)
  questionGroups?: QuestionGroupDTO[];
}

export class QuestionListResponseDTO {
  id!: string;
  title!: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  scoringMode!: 'simple' | 'groups';
  maxScore!: number;
  minQuestionsForMaxScore?: number;
  questionGroups?: any[];
  isRestricted!: boolean;
  countTowardScore!: boolean;
  classIds?: string[];
  questions?: any[];
  questionCount?: number;
  createdAt!: Date;
  updatedAt!: Date;
  calculatedStatus?: 'next' | 'open' | 'closed';

  constructor(partial: Partial<QuestionListResponseDTO>) {
    Object.assign(this, partial);
  }
}

