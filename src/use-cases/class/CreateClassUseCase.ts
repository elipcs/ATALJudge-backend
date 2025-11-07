import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { CreateClassDTO, ClassResponseDTO } from '../../dtos';
import { ClassRepository, UserRepository } from '../../repositories';
import { NotFoundError, UnauthorizedError } from '../../utils';
import { ClassMapper } from '../../mappers';
import { UserRole } from '../../enums';

export interface CreateClassInput {
  data: CreateClassDTO;
  userId: string;
}

@injectable()
export class CreateClassUseCase implements IUseCase<CreateClassInput, ClassResponseDTO> {
  constructor(
    @inject(ClassRepository) private classRepository: ClassRepository,
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async execute(input: CreateClassInput): Promise<ClassResponseDTO> {
    const { data, userId } = input;

    // Validate that user exists and is a professor
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ASSISTANT) {
      throw new UnauthorizedError('Only professors can create classes', 'NOT_PROFESSOR');
    }

    // Create class
    const classEntity = await this.classRepository.create({
      name: data.name,
      professorId: userId
    });

    return ClassMapper.toDTO(classEntity);
  }
}
