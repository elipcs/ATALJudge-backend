import { IsString, MinLength, IsOptional } from 'class-validator';
import { CreateQuestionDTO, UpdateQuestionDTO } from './QuestionDtos';

/**
 * DTO para criação de questão do Codeforces
 * Herda de CreateQuestionDTO e adiciona campos específicos
 */
export class CreateCodeforcesQuestionDTO extends CreateQuestionDTO {
  // Campos específicos do Codeforces
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

/**
 * DTO para atualização de questão do Codeforces
 * Herda de UpdateQuestionDTO e adiciona campos específicos
 */
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


