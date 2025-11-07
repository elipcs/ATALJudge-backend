import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { GradeResponseDTO } from '../../dtos';
import { GradeRepository } from '../../repositories';
import { NotFoundError } from '../../utils';
import { GradeMapper } from '../../mappers';

/**
 * Use Case: Get grade by ID
 * 
 * Responsibilities:
 * - Find grade by ID
 * - Include relationships (student, question_list)
 * - Convert to DTO
 */
@injectable()
export class GetGradeUseCase implements IUseCase<string, GradeResponseDTO> {
  constructor(
    @inject(GradeRepository) private gradeRepository: GradeRepository
  ) {}

  async execute(gradeId: string): Promise<GradeResponseDTO> {
    // 1. Find grade with relationships
    const grade = await this.gradeRepository.findById(gradeId);
    
    // 2. Validate existence
    if (!grade) {
      throw new NotFoundError('Grade not found', 'GRADE_NOT_FOUND');
    }
    
    // 3. Convert to detailed DTO
    return GradeMapper.toDetailDTO(grade);
  }
}
