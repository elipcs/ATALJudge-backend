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
    // Find class with students
    const classEntity = await this.classRepository.findByIdWithRelations(classId);
    
    if (!classEntity) {
      throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');
    }

    const students = classEntity.students || [];
    return students.map(s => UserMapper.toDTO(s));
  }
}
