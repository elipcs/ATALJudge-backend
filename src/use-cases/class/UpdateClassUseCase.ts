import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { CreateClassDTO, ClassResponseDTO } from '../../dtos';
import { ClassRepository, UserRepository } from '../../repositories';
import { NotFoundError, UnauthorizedError } from '../../utils';
import { ClassMapper } from '../../mappers';

export interface UpdateClassInput {
  classId: string;
  data: CreateClassDTO;
  userId?: string;
}

@injectable()
export class UpdateClassUseCase implements IUseCase<UpdateClassInput, ClassResponseDTO> {
  constructor(
    @inject(ClassRepository) private classRepository: ClassRepository,
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async execute(input: UpdateClassInput): Promise<ClassResponseDTO> {
    const { classId, data, userId } = input;

    // Check if class exists
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');
    }

    // If userId provided, validate permission
    if (userId) {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      // Check if user is the class professor
      if (classEntity.professorId !== userId) {
        throw new UnauthorizedError('Only the class professor can update it', 'NOT_CLASS_PROFESSOR');
      }
    }

    // Update class
    const updated = await this.classRepository.update(classId, {
      name: data.name
    });

    if (!updated) {
      throw new NotFoundError('Class not found after update', 'CLASS_NOT_FOUND');
    }

    return ClassMapper.toDTO(updated);
  }
}
