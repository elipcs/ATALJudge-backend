import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { ClassRepository } from '../../repositories';
import { NotFoundError } from '../../utils';
import { UserMapper } from '../../mappers';
import { UserResponseDTO } from '../../dtos';

@injectable()
export class GetClassStudentsUseCase implements IUseCase<string, UserResponseDTO[]> {
  constructor(
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(classId: string): Promise<UserResponseDTO[]> {
    // Find class with students - IMPORTANT: pass includeStudents: true
    const classEntity = await this.classRepository.findByIdWithRelations(classId, true, false);
    
    if (!classEntity) {
      throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');
    }

    // If students are not loaded via relation, fetch them directly
    let students = classEntity.students || [];
    
    // Fallback: if relation didn't load students, use findStudents method
    if (students.length === 0) {
      students = await this.classRepository.findStudents(classId);
    }

    return students.map(s => UserMapper.toDTO(s));
  }
}
