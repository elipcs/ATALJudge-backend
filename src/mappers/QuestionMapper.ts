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
      oracleCode: question.oracleCode,
      oracleLanguage: question.oracleLanguage,
      source: question.source ?? undefined,
      tags: question.tags ?? [],
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

    // Mapeia source e tags
    if (dto.source !== undefined && dto.source !== null) question.source = dto.source;
    if (dto.tags !== undefined && dto.tags !== null) question.tags = dto.tags;
  }

  /**
   * Aplica dados de UpdateQuestionDTO ao Question (Domain)
   * Inclui campos principais: título, enunciado, exemplos, limites, submission type
   */
  static applyUpdateDTO(question: Question, dto: UpdateQuestionDTO): void {
    if (dto.title !== undefined) question.title = dto.title;
    if (dto.text !== undefined) question.text = dto.text;
    if (dto.timeLimitMs !== undefined) question.timeLimitMs = dto.timeLimitMs;
    if (dto.memoryLimitKb !== undefined) question.memoryLimitKb = dto.memoryLimitKb;
    if (dto.examples !== undefined) question.examples = dto.examples;

    // Oracle code fields
    if (dto.oracleCode !== undefined) question.oracleCode = dto.oracleCode;
    if (dto.oracleLanguage !== undefined) question.oracleLanguage = dto.oracleLanguage;

    // Source and tags fields
    if (dto.source !== undefined && dto.source !== null) question.source = dto.source;
    if (dto.tags !== undefined && dto.tags !== null) question.tags = dto.tags;
  }



  /**
   * Creates a simplified DTO for listing
   */
  static toListItemDTO(question: Question): Pick<QuestionResponseDTO, 'id' | 'title'> {
    return {
      id: question.id,
      title: question.title,
    };
  }
}
