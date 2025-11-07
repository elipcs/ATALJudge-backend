import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { GradeRepository } from '../../repositories';
import { GradeMapper } from '../../mappers';

/**
 * Use Case: List student grades
 * 
 * Responsibilities:
 * - Find all student grades
 * - Include list information
 * - Convert to DTOs
 */
@injectable()
export class GetStudentGradesUseCase implements IUseCase<string, any[]> {
  constructor(
    @inject(GradeRepository) private gradeRepository: GradeRepository
  ) {}

  async execute(studentId: string): Promise<any[]> {
    // 1. Find student grades
    const grades = await this.gradeRepository.findByStudent(studentId);
    
    // 2. Convert to DTOs
    return grades.map(grade => GradeMapper.toListItemDTO(grade));
  }
}
