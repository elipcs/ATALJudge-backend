/**
 * Question Data Mapper
 * 
 * Maps between Question domain models and DTOs.
 * Handles conversion of Question entities to data transfer objects for API responses.
 * 
 * @module mappers/QuestionMapper
 */
import { Question } from '../models/Question';
import { QuestionResponseDTO, CreateQuestionDTO, UpdateQuestionDTO } from '../dtos/QuestionDtos';

/**
 * Question Mapper Class
 * 
 * Provides static methods for converting between Question domain objects and DTOs.
 * 
 * @class QuestionMapper
 */
export class QuestionMapper {
  /**
   * Converts a Question domain model to QuestionResponseDTO
   * 
   * @static
   * @param {Question} question - The question domain model
   * @returns {QuestionResponseDTO} The question data transfer object
   */
  static toDTO(question: Question): QuestionResponseDTO {
    return new QuestionResponseDTO({
      id: question.id,
      title: question.title,
      text: question.text,
      timeLimitMs: question.timeLimitMs,
      memoryLimitKb: question.memoryLimitKb,
      examples: question.examples,
      submissionType: question.submissionType,
      contestId: question.contestId,
      problemIndex: question.problemIndex,
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
    question.text = dto.text;
    question.timeLimitMs = dto.timeLimitMs || 1000;
    question.memoryLimitKb = dto.memoryLimitKb || 64000;
    question.examples = dto.examples || [];
    question.submissionType = dto.submissionType || 'local';
    
    // Mapeia campos do Codeforces se fornecidos
    if (dto.contestId !== undefined) question.contestId = dto.contestId;
    if (dto.problemIndex !== undefined) question.problemIndex = dto.problemIndex;
  }

  /**
   * Aplica dados de UpdateQuestionDTO ao Question (Domain)
   * Inclui campos principais: título, enunciado, exemplos, limites, submission type
   * NÃO inclui campos Codeforces (contestId, problemIndex) - use applyCodeforcesUpdate
   */
  static applyUpdateDTO(question: Question, dto: UpdateQuestionDTO): void {
    if (dto.title !== undefined) question.title = dto.title;
    if (dto.text !== undefined) question.text = dto.text;
    if (dto.timeLimitMs !== undefined) question.timeLimitMs = dto.timeLimitMs;
    if (dto.memoryLimitKb !== undefined) question.memoryLimitKb = dto.memoryLimitKb;
    if (dto.wallTimeLimitSeconds !== undefined) question.wallTimeLimitSeconds = dto.wallTimeLimitSeconds;
    if (dto.examples !== undefined) question.examples = dto.examples;
    
    // Apenas submission type (os campos contestId/problemIndex vão via endpoint separado)
    if (dto.submissionType !== undefined) question.submissionType = dto.submissionType;
  }

  /**
   * Aplica campos Codeforces ao Question (Domain)
   * Usado pelo endpoint separado PUT /api/questions/:id/codeforces
   * 
   * @param question - Question entity to update
   * @param dto - UpdateCodeforcesFieldsDTO with contestId, problemIndex
   */
  static applyCodeforcesUpdate(question: Question, dto: any): void {
    if (dto.contestId !== undefined) question.contestId = dto.contestId;
    if (dto.problemIndex !== undefined) question.problemIndex = dto.problemIndex;
  }

  /**
   * Creates a simplified DTO for listing
   */
  static toListItemDTO(question: Question): Pick<QuestionResponseDTO, 'id' | 'title' | 'submissionType'> {
    return {
      id: question.id,
      title: question.title,
      submissionType: question.submissionType
    };
  }
}
