import { IsString, IsOptional, IsArray, IsEnum, IsInt, Min, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para grupo de questões
 */
export class QuestionGroupDTO {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsArray()
  @IsString({ each: true })
  questionIds!: string[];

  @IsInt()
  @Min(0)
  weight!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  percentage?: number;
}

/**
 * DTO para criação de lista de questões
 * Questões e grupos são configurados depois da criação
 */
export class CreateQuestionListDTO {
  @IsString()
  title!: string;

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
  @IsArray()
  @IsString({ each: true})
  classIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionGroupDTO)
  questionGroups?: QuestionGroupDTO[];
}

/**
 * DTO para atualização de lista de questões
 */
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

  @IsOptional()
  @IsBoolean()
  isRestricted?: boolean;
}

/**
 * DTO de resposta de lista de questões
 */
export class QuestionListResponseDTO {
  id!: string;
  title!: string;
  description?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
  scoringMode!: 'simple' | 'groups';
  maxScore!: number;
  minQuestionsForMaxScore?: number;
  questionGroups?: any[];
  isRestricted!: boolean;
  classIds?: string[];
  questions?: any[];
  createdAt!: Date;
  updatedAt!: Date;
  calculatedStatus?: 'next' | 'open' | 'closed';

  constructor(partial: Partial<QuestionListResponseDTO>) {
    Object.assign(this, partial);
  }
}


