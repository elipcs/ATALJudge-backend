import { IsString, MinLength, IsOptional } from 'class-validator';
import { CreateQuestionDTO, UpdateQuestionDTO } from './QuestionDtos';

export class CreateCodeforcesQuestionDTO extends CreateQuestionDTO {
  
  @IsString()
  @MinLength(1, { message: 'Contest ID é obrigatório' })
  contestId!: string;

  @IsString()
  @MinLength(1, { message: 'Problem Index é obrigatório' })
  problemIndex!: string;

  @IsOptional()
  @IsString()
  codeforcesLink?: string;
}

export class UpdateCodeforcesQuestionDTO extends UpdateQuestionDTO {
  @IsOptional()
  @IsString()
  contestId?: string;

  @IsOptional()
  @IsString()
  problemIndex?: string;

  @IsOptional()
  @IsString()
  codeforcesLink?: string;
}

