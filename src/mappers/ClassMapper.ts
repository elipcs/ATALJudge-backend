import { Class } from '../models';
import { ClassResponseDTO } from '../dtos';

/**
 * Mapper: Class Entity ↔ DTOs
 * 
 * Responsabilidades:
 * - Converter entidade Class para ClassResponseDTO
 * - Garantir separação entre camada de domínio e apresentação
 */
export class ClassMapper {
  /**
   * Converte Class entity para ClassResponseDTO
   */
  static toDTO(classEntity: Class): ClassResponseDTO {
    return new ClassResponseDTO({
      id: classEntity.id,
      name: classEntity.name,
      professorId: classEntity.professorId,
      professorName: classEntity.professor?.name,
      studentIds: classEntity.students?.map(s => s.id),
      professor: classEntity.professor ? {
        id: classEntity.professor.id,
        name: classEntity.professor.name,
        email: classEntity.professor.email,
        role: classEntity.professor.role
      } : undefined,
      students: classEntity.students?.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        createdAt: s.createdAt.toISOString()
      })),
      studentCount: classEntity.students?.length || 0,
      createdAt: classEntity.createdAt,
      updatedAt: classEntity.updatedAt
    });
  }
}
