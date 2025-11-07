import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UserResponseDTO } from '../../dtos/UserDtos';
import { UserRepository, GradeRepository } from '../../repositories';
import { NotFoundError, logger } from '../../utils';
import { UserRole } from '../../enums';
import { UserMapper } from '../../mappers/UserMapper';

/**
 * Use Case: Get user by ID
 * 
 * Responsibilities:
 * - Find user by ID
 * - If student, include their grades
 * - Convert to DTO using UserMapper
 */
@injectable()
export class GetUserUseCase implements IUseCase<string, UserResponseDTO> {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(GradeRepository) private gradeRepository: GradeRepository
  ) {}

  async execute(userId: string): Promise<UserResponseDTO> {
    // 1. Find user
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      logger.warn('[GetUserUseCase] User not found', { userId });
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // 2. Convert to DTO
    const userDTO = UserMapper.toDTO(user);

    // 3. If student, include grades
    if (user.role === UserRole.STUDENT) {
      const grades = await this.gradeRepository.findByStudent(userId);
      userDTO.grades = grades.map(grade => ({
        id: grade.id,
        questionListId: grade.questionListId,
        questionListTitle: grade.questionList?.title,
        score: grade.score,
        createdAt: grade.createdAt,
        updatedAt: grade.updatedAt
      }));
    }

    return userDTO;
  }
}
