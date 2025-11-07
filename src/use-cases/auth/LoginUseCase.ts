import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { UserLoginDTO, UserResponseDTO } from '../../dtos';
import { UserRepository } from '../../repositories';
import { RefreshTokenService } from '../../services/RefreshTokenService';
import { TokenManager, JwtPayload } from '../../utils/TokenManager';
import { config } from '../../config';
import { logger, UnauthorizedError } from '../../utils';
import { UserMapper } from '../../mappers';

export interface LoginUseCaseInput {
  dto: UserLoginDTO;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginUseCaseOutput {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
}

/**
 * Use Case: Perform user login
 * 
 * Responsibilities:
 * - Validate credentials (email/password)
 * - Generate access and refresh tokens
 * - Save refresh token to database
 * - Update user's last login
 * - Apply active token limit
 */
@injectable()
export class LoginUseCase implements IUseCase<LoginUseCaseInput, LoginUseCaseOutput> {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService
  ) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    const { dto, ipAddress, userAgent } = input;

    // 1. Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Email or password incorrect', 'INVALID_CREDENTIALS');
    }

    // 2. Verify password
    const isPasswordValid = await user.checkPassword(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email or password incorrect', 'INVALID_CREDENTIALS');
    }

    // 3. Update last login
    await this.userRepository.updateLastLogin(user.id);

    // 4. Generate JWT tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    // 5. Save refresh token to database
    await this.refreshTokenService.saveRefreshToken(
      user.id,
      refreshToken,
      config.jwt.refreshExpires,
      ipAddress,
      userAgent
    );

    // 6. Apply active token limit (maximum 5 devices)
    await this.refreshTokenService.enforceTokenLimit(user.id, 5);

    logger.info('[LoginUseCase] Login successful', { 
      userId: user.id, 
      email: user.email 
    });

    // 7. Convert to DTO and return
    return {
      user: UserMapper.toDTO(user),
      accessToken,
      refreshToken
    };
  }
}
