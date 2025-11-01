import { CreateQuestionDTO, UpdateQuestionDTO } from './QuestionDtos';

/**
 * DTO para criação de questão local
 * Herda todos os campos de CreateQuestionDTO
 */
export class CreateLocalQuestionDTO extends CreateQuestionDTO {
  // LocalQuestion não tem campos adicionais além dos da base
}

/**
 * DTO para atualização de questão local
 * Herda todos os campos de UpdateQuestionDTO
 */
export class UpdateLocalQuestionDTO extends UpdateQuestionDTO {
  // LocalQuestion não tem campos adicionais além dos da base
}


