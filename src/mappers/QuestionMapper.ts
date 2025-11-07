import { Question } from '../models/Question';
import { QuestionResponseDTO, CreateQuestionDTO, UpdateQuestionDTO } from '../dtos/QuestionDtos';

/**
 * Mapper para transformação entre Question (Domain) e DTOs
 */
export class QuestionMapper {
  /**
   * Converte Question (Domain) para QuestionResponseDTO
   */
  static toDTO(question: Question): QuestionResponseDTO {
    return new QuestionResponseDTO({
      id: question.id,
      title: question.title,
      statement: question.statement,
      inputFormat: question.inputFormat,
      outputFormat: question.outputFormat,
      constraints: question.constraints,
      notes: question.notes,
      tags: question.tags,
      timeLimitMs: question.timeLimitMs,
      memoryLimitKb: question.memoryLimitKb,
      examples: question.examples,
      submissionType: question.submissionType,
      codeforcesContestId: question.contestId,
      codeforcesProblemIndex: question.problemIndex,
      codeforcesLink: question.codeforcesLink,
      authorId: question.authorId,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    });
  }

  /**
   * Converte lista de Questions para lista de DTOs
   */
  static toDTOList(questions: Question[]): QuestionResponseDTO[] {
    return questions.map(q => this.toDTO(q));
  }

  /**
   * Aplica dados de CreateQuestionDTO ao Question (Domain)
   */
  static applyCreateDTO(question: Question, dto: CreateQuestionDTO): void {
    question.title = dto.title;
    question.statement = dto.statement;
    question.inputFormat = dto.inputFormat || '';
    question.outputFormat = dto.outputFormat || '';
    question.constraints = dto.constraints || '';
    question.notes = dto.notes || '';
    question.tags = dto.tags || [];
    question.timeLimitMs = dto.timeLimitMs || 1000;
    question.memoryLimitKb = dto.memoryLimitKb || 64000;
    question.examples = dto.examples || [];
    question.submissionType = dto.submissionType || 'local';
    
    // Gera link do codeforces se for tipo codeforces
    if (question.isCodeforces()) {
      question.generateCodeforcesLink();
    }
  }

  /**
   * Aplica dados de UpdateQuestionDTO ao Question (Domain)
   */
  static applyUpdateDTO(question: Question, dto: UpdateQuestionDTO): void {
    if (dto.title !== undefined) question.title = dto.title;
    if (dto.statement !== undefined) question.statement = dto.statement;
    if (dto.inputFormat !== undefined) question.inputFormat = dto.inputFormat;
    if (dto.outputFormat !== undefined) question.outputFormat = dto.outputFormat;
    if (dto.constraints !== undefined) question.constraints = dto.constraints;
    if (dto.notes !== undefined) question.notes = dto.notes;
    if (dto.tags !== undefined) question.tags = dto.tags;
    if (dto.timeLimitMs !== undefined) question.timeLimitMs = dto.timeLimitMs;
    if (dto.memoryLimitKb !== undefined) question.memoryLimitKb = dto.memoryLimitKb;
    if (dto.wallTimeLimitSeconds !== undefined) question.wallTimeLimitSeconds = dto.wallTimeLimitSeconds;
    if (dto.examples !== undefined) question.examples = dto.examples;
    
    if (question.isCodeforces()) {
      question.generateCodeforcesLink();
    }
  }

  /**
   * Cria um DTO simplificado para listagem
   */
  static toListItemDTO(question: Question): Pick<QuestionResponseDTO, 'id' | 'title' | 'tags' | 'submissionType'> {
    return {
      id: question.id,
      title: question.title,
      tags: question.tags,
      submissionType: question.submissionType
    };
  }
}
