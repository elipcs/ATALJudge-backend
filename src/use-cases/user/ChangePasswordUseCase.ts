import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { ChangePasswordDTO } from '../../dtos/UserDtos';
import { UserRepository } from '../../repositories';
import { NotFoundError, UnauthorizedError, logger } from '../../utils';

/**
 * Use Case: Change user password
 * 
 * Responsibilities:
 * - Find user
 * - Validate current password
 * - Apply new password using domain method
 * - Save to database
 */
@injectable()
export class ChangePasswordUseCase implements IUseCase<{ userId: string; dto: ChangePasswordDTO }, void> {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async execute(input: { userId: string; dto: ChangePasswordDTO }): Promise<void> {
    const { userId, dto } = input;

    // 1. Find user
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      logger.warn('[ChangePasswordUseCase] User not found', { userId });
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    // 2. Validate current password
    const isPasswordValid = await user.checkPassword(dto.currentPassword);
    if (!isPasswordValid) {
      logger.warn('[ChangePasswordUseCase] Current password incorrect', { userId });
      throw new UnauthorizedError('Current password incorrect', 'INVALID_PASSWORD');
    }

    // 3. Apply new password using domain method
    await user.setPassword(dto.newPassword);

    // 4. Save to database
    await this.userRepository.update(userId, user);

    logger.info('[ChangePasswordUseCase] Password changed successfully', { userId });
  }
}
