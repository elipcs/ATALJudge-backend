/**
 * Question List Data Mapper
 * 
 * Maps between QuestionList domain models and DTOs.
 * Handles conversion of QuestionList entities to data transfer objects for API responses.
 * 
 * @module mappers/QuestionListMapper
 */
import { QuestionList } from '../models/QuestionList';
import { QuestionListResponseDTO } from '../dtos/QuestionListDtos';

/**
 * Question List Mapper Class
 * 
 * Provides static methods for converting between QuestionList domain objects and DTOs.
 * 
 * @class QuestionListMapper
 */
export class QuestionListMapper {
  /**
   * Converts a QuestionList domain model to QuestionListResponseDTO
   * 
   * @static
   * @param {QuestionList} questionList - The question list domain model
   * @returns {QuestionListResponseDTO} The question list data transfer object
   */
  static toDTO(questionList: QuestionList): QuestionListResponseDTO {
    const classIds = questionList.classes?.map((c: { id: string }) => c.id) || [];

    const questions = (questionList.questions || [])
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      })
      .map((q: any) => {
        return {
          id: q.id,
          title: q.title,
          statement: q.statement,
          inputFormat: q.inputFormat,
          outputFormat: q.outputFormat,
          constraints: q.constraints,
          notes: q.notes,
          tags: q.tags,
          timeLimitMs: q.timeLimitMs,
          memoryLimitKb: q.memoryLimitKb,
          examples: q.examples,
        };
      });

    return new QuestionListResponseDTO({
      id: questionList.id,
      title: questionList.title,
      description: questionList.description,
      startDate: questionList.startDate?.toISOString(),
      endDate: questionList.endDate?.toISOString(),
      scoringMode: questionList.scoringMode,
      maxScore: questionList.maxScore,
      minQuestionsForMaxScore: questionList.minQuestionsForMaxScore,
      questionGroups: questionList.questionGroups,
      isRestricted: questionList.isRestricted,
      countTowardScore: questionList.countTowardScore,
      classIds,
      questions,
      questionCount: questions.length,
      createdAt: questionList.createdAt,
      updatedAt: questionList.updatedAt,
      calculatedStatus: questionList.getCalculatedStatus()
    });
  }
}
