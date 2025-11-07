/**
 * Grade Data Mapper
 * 
 * Maps between Grade domain models and DTOs.
 * Handles conversion of Grade entities to data transfer objects for API responses.
 * 
 * @module mappers/GradeMapper
 */
import { Grade } from '../models/Grade';
import { GradeResponseDTO } from '../dtos/GradeDtos';

/**
 * Grade Mapper Class
 * 
 * Provides static methods for converting between Grade domain objects and DTOs.
 * 
 * @class GradeMapper
 */
export class GradeMapper {
  /**
   * Converts a Grade domain model to GradeResponseDTO
   * 
   * @static
   * @param {Grade} grade - The grade domain model
   * @returns {GradeResponseDTO} The grade data transfer object
   */
  static toDTO(grade: Grade): GradeResponseDTO {
    return new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      questionListId: grade.questionListId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt
    });
  }

  /**
   * Converte lista de Grades para lista de DTOs
   */
  static toDTOList(grades: Grade[]): GradeResponseDTO[] {
    return grades.map(g => this.toDTO(g));
  }

  /**
   * Creates a DTO enriched with performance information
   */
  static toDetailDTO(grade: Grade) {
    return {
      ...this.toDTO(grade),
      percentage: grade.getPercentage(),
      isPassing: grade.isPassing(),
      isPerfectScore: grade.isPerfectScore(),
      isRecent: grade.isRecent()
    };
  }

  /**
   * Creates a simplified DTO for listing
   */
  static toListItemDTO(grade: Grade): Pick<GradeResponseDTO, 'id' | 'questionListId' | 'score'> {
    return {
      id: grade.id,
      questionListId: grade.questionListId,
      score: grade.score
    };
  }
}
