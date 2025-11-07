import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { GradeResponseDTO } from '../../dtos';
import { GradeRepository } from '../../repositories';
import { GradeMapper } from '../../mappers';

export interface GetGradeByStudentAndListInput {
  studentId: string;
  questionListId: string;
}

/**
 * Use Case: Get student grade for a specific list
 * 
 * Responsibilities:
 * - Search grade by studentId + questionListId combination
 * - Include relationships (student, question_list)
 * - Convert to DTO
 * - Return null if not found (not an error)
 */
@injectable()
export class GetGradeByStudentAndListUseCase implements IUseCase<GetGradeByStudentAndListInput, GradeResponseDTO | null> {
  constructor(
    @inject(GradeRepository) private gradeRepository: GradeRepository
  ) {}

  async execute(input: GetGradeByStudentAndListInput): Promise<GradeResponseDTO | null> {
    const { studentId, questionListId } = input;

    // 1. Find grade with relationships
    const grade = await this.gradeRepository.findByStudentAndList(studentId, questionListId);

    // 2. Return null if not found (student may not have a grade yet)
    if (!grade) {
      return null;
    }

    // 3. Convert to DTO
    return GradeMapper.toDTO(grade);
  }
}
