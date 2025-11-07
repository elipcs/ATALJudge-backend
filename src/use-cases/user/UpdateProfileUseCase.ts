import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UpdateProfileDTO, UserResponseDTO } from '../../dtos/UserDtos';
import { UserRepository } from '../../repositories';
import { NotFoundError, ConflictError, InternalServerError, logger } from '../../utils';
import { UserMapper } from '../../mappers/UserMapper';

/**
 * Use Case: Update user profile
 * 
 * Responsibilities:
 * - Find existing user
 * - Validate unique email (if changed)
 * - Apply updates
 * - Save to database
 * - Convert to DTO
 */
@injectable()
export class UpdateProfileUseCase implements IUseCase<{ userId: string; dto: UpdateProfileDTO }, UserResponseDTO> {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async execute(input: { userId: string; dto: UpdateProfileDTO }): Promise<UserResponseDTO> {
    const { userId, dto } = input;

    // 1. Find user
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      logger.warn('[UpdateProfileUseCase] User not found', { userId });
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // 2. Validate unique email (if changed)
    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.userRepository.emailExists(dto.email);
      if (emailExists) {
        logger.warn('[UpdateProfileUseCase] Email already in use', { email: dto.email });
        throw new ConflictError('Email is already in use', 'EMAIL_IN_USE');
      }
    }

    // 3. Apply updates
    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    
    // Update studentRegistration if applicable
    if (dto.studentRegistration !== undefined && 'studentRegistration' in user) {
      (user as any).studentRegistration = dto.studentRegistration;
    }

    // 4. Save to database
    const updatedUser = await this.userRepository.save(user);
    
    if (!updatedUser) {
      throw new InternalServerError('Error updating profile', 'UPDATE_ERROR');
    }

    logger.info('[UpdateProfileUseCase] Profile updated', { userId });

    // 5. Convert to DTO
    return UserMapper.toDTO(updatedUser);
  }
}
