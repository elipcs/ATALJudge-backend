import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { ClassRepository, UserRepository } from '../../repositories';
import { NotFoundError, UnauthorizedError } from '../../utils';

export interface DeleteClassInput {
  classId: string;
  userId?: string;
}

@injectable()
export class DeleteClassUseCase implements IUseCase<DeleteClassInput, void> {
  constructor(
    @inject(ClassRepository) private classRepository: ClassRepository,
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async execute(input: DeleteClassInput): Promise<void> {
    const { classId, userId } = input;

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
        throw new UnauthorizedError('Only the class professor can delete it', 'NOT_CLASS_PROFESSOR');
      }
    }

    // Delete class
    await this.classRepository.delete(classId);
  }
}
