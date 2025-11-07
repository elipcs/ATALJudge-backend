import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { GradeRepository } from '../../repositories';
import { GradeMapper } from '../../mappers';

/**
 * Use Case: List grades for a list
 * 
 * Responsibilities:
 * - Find all grades for the list
 * - Include student information
 * - Order by score (highest to lowest)
 * - Convert to DTOs
 */
@injectable()
export class GetListGradesUseCase implements IUseCase<string, any[]> {
  constructor(
    @inject(GradeRepository) private gradeRepository: GradeRepository
  ) {}

  async execute(questionListId: string): Promise<any[]> {
    // 1. Find grades for the list
    const grades = await this.gradeRepository.findByList(questionListId);
    
    // 2. Order by score (highest to lowest)
    grades.sort((a, b) => b.score - a.score);
    
    // 3. Convert to DTOs
    return grades.map(grade => GradeMapper.toListItemDTO(grade));
  }
}
