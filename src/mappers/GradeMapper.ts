import { Grade } from '../models/Grade';
import { GradeResponseDTO } from '../dtos/GradeDtos';

/**
 * Mapper para transformação entre Grade (Domain) e DTOs
 */
export class GradeMapper {
  /**
   * Converte Grade (Domain) para GradeResponseDTO
   */
  static toDTO(grade: Grade): GradeResponseDTO {
    return new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      listId: grade.listId,
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
   * Cria um DTO enriquecido com informações de performance
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
   * Cria um DTO simplificado para listagem
   */
  static toListItemDTO(grade: Grade): Pick<GradeResponseDTO, 'id' | 'listId' | 'score'> {
    return {
      id: grade.id,
      listId: grade.listId,
      score: grade.score
    };
  }
}
