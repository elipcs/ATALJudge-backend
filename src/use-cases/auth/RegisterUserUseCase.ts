import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UserRegisterDTO, UserResponseDTO } from '../../dtos';
import { UserRepository, ClassRepository } from '../../repositories';
import { RefreshTokenService } from '../../services/RefreshTokenService';
import { InviteService } from '../../services/InviteService';
import { TokenManager, JwtPayload } from '../../utils/TokenManager';
import { config } from '../../config';
import { UserRole } from '../../enums/UserRole';
import { logger, ConflictError } from '../../utils';
import { User } from '../../models/User';
import { Student } from '../../models/Student';
import { Professor } from '../../models/Professor';
import { UserMapper } from '../../mappers';

export interface RegisterUserUseCaseOutput {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
}

/**
 * Use Case: Register new user
 * 
 * Responsibilities:
 * - Validate email uniqueness
 * - Process invite (if provided)
 * - Create user with appropriate type (Student/Professor/User)
 * - Add student to class (if applicable)
 * - Generate authentication tokens
 * - Mark invite as used
 */
@injectable()
export class RegisterUserUseCase implements IUseCase<UserRegisterDTO, RegisterUserUseCaseOutput> {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService,
    @inject(InviteService) private inviteService: InviteService,
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(dto: UserRegisterDTO): Promise<RegisterUserUseCaseOutput> {
    // 1. Check if email already exists
    const emailExists = await this.userRepository.emailExists(dto.email);
    if (emailExists) {
      throw new ConflictError('Email is already in use', 'EMAIL_IN_USE');
    }

    // 2. Process invite (if provided)
    let targetClassId: string | undefined = dto.classId;
    if (dto.inviteToken) {
      const inviteData = await this.inviteService.validateInvite(dto.inviteToken);
      targetClassId = inviteData.classId;
    }

    // 3. Determine user role
    const userRole = dto.role || UserRole.STUDENT;

    // 4. Create appropriate user instance
    let user: User;
    if (userRole === UserRole.STUDENT) {
      const student = new Student();
      student.studentRegistration = dto.studentRegistration;
      user = student;
    } else if (userRole === UserRole.PROFESSOR) {
      user = new Professor();
    } else {
      user = new User();
    }

    // 5. Apply DTO data to user
    user.name = dto.name;
    user.email = dto.email;
    user.role = userRole;
    await user.setPassword(dto.password);

    // 6. Save user to database
    const savedUser = await this.userRepository.create(user);
    logger.info('[RegisterUserUseCase] User registered', { 
      userId: savedUser.id, 
      role: savedUser.role 
    });

    // 7. Mark invite as used
    if (dto.inviteToken) {
      await this.inviteService.useInvite(dto.inviteToken);
    }

    // 8. Add student to class (if applicable)
    if (userRole === UserRole.STUDENT && targetClassId) {
      try {
        await this.classRepository.addStudent(targetClassId, savedUser.id);
        logger.info('[RegisterUserUseCase] Student added to class', { 
          userId: savedUser.id, 
          classId: targetClassId 
        });
      } catch (error) {
        logger.error('[RegisterUserUseCase] Failed to add student to class', { 
          error, 
          userId: savedUser.id, 
          classId: targetClassId 
        });
      }
    }

    // 9. Generate JWT tokens
    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    };
    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    // 10. Save refresh token to database
    await this.refreshTokenService.saveRefreshToken(
      savedUser.id,
      refreshToken,
      config.jwt.refreshExpires
    );

    // 11. Apply active token limit
    await this.refreshTokenService.enforceTokenLimit(savedUser.id, 5);

    // 12. Return result
    return {
      user: UserMapper.toDTO(savedUser),
      accessToken,
      refreshToken
    };
  }
}
