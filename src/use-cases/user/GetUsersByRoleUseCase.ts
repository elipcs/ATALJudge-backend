import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UserResponseDTO } from '../../dtos/UserDtos';
import { UserRepository } from '../../repositories';
import { UserRole } from '../../enums';
import { UserMapper } from '../../mappers/UserMapper';
import { ValidationError, logger } from '../../utils';

/**
 * Use Case: Get users by role
 * 
 * Responsibilities:
 * - Find users by role
 * - Convert to DTOs using UserMapper
 */
@injectable()
export class GetUsersByRoleUseCase implements IUseCase<string, UserResponseDTO[]> {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async execute(role: string): Promise<UserResponseDTO[]> {
    // Validate role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      logger.warn('[GetUsersByRoleUseCase] Invalid role requested', { role, validRoles });
      throw new ValidationError(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`, 'INVALID_ROLE');
    }

    logger.info('[GetUsersByRoleUseCase] Fetching users by role', { role });
    
    // Find users by role
    const users = await this.userRepository.findByRole(role);
    
    logger.info('[GetUsersByRoleUseCase] Users found', { role, count: users.length });
    
    // Convert to DTOs
    return users.map(user => UserMapper.toDTO(user));
  }
}

