import { UserRepository, TokenBlacklistRepository, ClassRepository } from '../repositories';
import { TokenManager, JwtPayload } from '../utils/TokenManager';
import { UserRegisterDTO, UserLoginDTO, UserResponseDTO, RequestPasswordResetDTO, ResetPasswordDTO, InviteResponseDTO } from '../dtos';
import { RefreshTokenService } from './RefreshTokenService';
import { PasswordResetService } from './PasswordResetService';
import { EmailService } from './EmailService';
import { InviteService } from './InviteService';
import { config } from '../config';
import { UserRole } from '../enums/UserRole';
import { logger, ConflictError, UnauthorizedError, TokenError, InternalServerError } from '../utils';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Professor } from '../models/Professor';

export class AuthService {
  private userRepository: UserRepository;
  private refreshTokenService: RefreshTokenService;
  private passwordResetService: PasswordResetService;
  private emailService: EmailService;
  private tokenBlacklistRepository: TokenBlacklistRepository;
  private inviteService: InviteService;
  private classRepository: ClassRepository;

  constructor(
    userRepository: UserRepository,
    refreshTokenService: RefreshTokenService,
    passwordResetService: PasswordResetService,
    emailService: EmailService,
    tokenBlacklistRepository: TokenBlacklistRepository,
    inviteService: InviteService,
    classRepository: ClassRepository
  ) {
    this.userRepository = userRepository;
    this.refreshTokenService = refreshTokenService;
    this.passwordResetService = passwordResetService;
    this.emailService = emailService;
    this.tokenBlacklistRepository = tokenBlacklistRepository;
    this.inviteService = inviteService;
    this.classRepository = classRepository;
  }

  async registerWithInvite(dto: UserRegisterDTO): Promise<{
    user: UserResponseDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    
    const emailExists = await this.userRepository.emailExists(dto.email);
    if (emailExists) {
      throw new ConflictError('Email já está em uso', 'EMAIL_IN_USE');
    }

    let inviteData: InviteResponseDTO | null = null;
    let targetClassId: string | undefined = dto.classId; // Usar classId do DTO como padrão

    if (dto.inviteToken) {
      inviteData = await this.inviteService.validateInvite(dto.inviteToken);
      logger.info(`Convite validado: id=${inviteData.id}, classId=${inviteData.classId}`);
      targetClassId = inviteData.classId; // Usar classId do convite se houver
    }

    const userRole = dto.role || UserRole.STUDENT;

    let user: User;
    
    // Criar a instância correta baseada no role
    if (userRole === UserRole.STUDENT) {
      const student = new Student();
      student.studentRegistration = dto.studentRegistration;
      user = student;
    } else if (userRole === UserRole.PROFESSOR) {
      user = new Professor();
    } else {
      user = new User();
    }

    user.name = dto.name;
    user.email = dto.email.toLowerCase();
    user.role = userRole;
    await user.setPassword(dto.password);

    const savedUser = await this.userRepository.create(user);
    logger.info(`Usuário criado: id=${savedUser.id}, role=${savedUser.role}, email=${savedUser.email}`);

    if (dto.inviteToken) {
      await this.inviteService.useInvite(dto.inviteToken);
      logger.info(`Convite incrementado: token=${dto.inviteToken}`);
    }

    // Adicionar estudante à turma (do convite ou do DTO)
    if (userRole === UserRole.STUDENT && targetClassId) {
      logger.info(`Adicionando estudante ${savedUser.id} à turma ${targetClassId}`);
      try {
        await this.classRepository.addStudent(targetClassId, savedUser.id);
        logger.info(`Estudante adicionado com sucesso à turma ${targetClassId}`);
      } catch (error) {
        logger.error(`Falha ao adicionar estudante à turma: ${error}`);
        // Não relança - usuário já foi criado com sucesso
      }
    } else {
      logger.info(`Estudante NÃO adicionado à turma: role=${userRole}, classId=${targetClassId}`);
    }

    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    };

    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    await this.refreshTokenService.saveRefreshToken(
      savedUser.id,
      refreshToken,
      config.jwt.refreshExpires
    );

    await this.refreshTokenService.enforceTokenLimit(savedUser.id, 5);

    return {
      user: new UserResponseDTO(savedUser),
      accessToken,
      refreshToken
    };
  }

  async loginWithEmail(
    dto: UserLoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: UserResponseDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Email ou senha incorretos', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await user.checkPassword(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email ou senha incorretos', 'INVALID_CREDENTIALS');
    }

    await this.userRepository.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    logger.debug('[LOGIN] Tokens gerados', {
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
      userId: user.id
    });

    await this.refreshTokenService.saveRefreshToken(
      user.id,
      refreshToken,
      config.jwt.refreshExpires,
      ipAddress,
      userAgent
    );

    await this.refreshTokenService.enforceTokenLimit(user.id, 5);

    return {
      user: new UserResponseDTO(user),
      accessToken,
      refreshToken
    };
  }

  async refreshToken(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    
    if (!oldRefreshToken || typeof oldRefreshToken !== 'string' || oldRefreshToken.length < 100) {
      throw new TokenError('Refresh token inválido: formato incorreto', 'INVALID_TOKEN_FORMAT');
    }

    const payload = TokenManager.verifyRefreshToken(oldRefreshToken);

    if (!payload || !payload.sub || typeof payload.sub !== 'string') {
      throw new TokenError('Refresh token inválido: payload incompleto', 'INVALID_TOKEN_PAYLOAD');
    }

    const storedToken = await this.refreshTokenService.validateAndUseToken(oldRefreshToken);

    await this.refreshTokenService.revokeToken(oldRefreshToken);

    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    await this.refreshTokenService.saveRefreshToken(
      payload.sub,
      refreshToken,
      config.jwt.refreshExpires,
      storedToken.ipAddress,
      storedToken.userAgent,
      storedToken.familyId 
    );

    return {
      accessToken,
      refreshToken
    };
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {

    TokenManager.verifyAccessToken(accessToken);
    await this.tokenBlacklistRepository.create({
      token: accessToken,
      expiresAt: TokenManager.calculateExpirationDate(config.jwt.accessExpires),
      reason: 'logout'
    });

    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  async requestPasswordReset(dto: RequestPasswordResetDTO): Promise<{ message: string }> {
    try {
      
      const user = await this.userRepository.findByEmail(dto.email);

      if (!user) {
        logger.warn('[AUTH] Tentativa de reset para email não cadastrado', { email: dto.email });
        
        return {
          message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
        };
      }

      await this.passwordResetService.revokeAllUserTokens(user.id);

      const resetToken = await this.passwordResetService.createResetToken(user.id, 1);

      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.name,
          resetToken
        );
        logger.info('[AUTH] Email de reset enviado com sucesso', { email: user.email });
      } catch (emailError) {
        logger.error('[AUTH] Erro ao enviar email de reset', { 
          email: user.email, 
          error: emailError instanceof Error ? emailError.message : 'Erro desconhecido' 
        });
        
        await this.passwordResetService.revokeAllUserTokens(user.id);
        throw new InternalServerError('Erro ao enviar email. Tente novamente mais tarde.', 'EMAIL_ERROR');
      }

      return {
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
      };
    } catch (error) {
      logger.error('[AUTH] Erro ao processar solicitação de reset', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
      throw error;
    }
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<{ message: string }> {
    try {
      
      const resetToken = await this.passwordResetService.validateToken(dto.token);

      if (!resetToken) {
        throw new TokenError('Token inválido ou expirado', 'INVALID_RESET_TOKEN');
      }

      const user = await this.userRepository.findById(resetToken.userId);
      if (!user) {
        throw new UnauthorizedError('Usuário não encontrado', 'USER_NOT_FOUND');
      }

      await user.setPassword(dto.newPassword);

      await this.userRepository.save(user);

      await this.passwordResetService.markTokenAsUsed(resetToken);
      await this.passwordResetService.revokeToken(resetToken);

      await this.refreshTokenService.revokeAllUserTokens(user.id);

      try {
        await this.emailService.sendPasswordResetConfirmation(user.email, user.name);
        logger.info('[AUTH] Email de confirmação enviado', { email: user.email });
      } catch (emailError) {
        logger.error('[AUTH] Erro ao enviar email de confirmação', { 
          email: user.email, 
          error: emailError instanceof Error ? emailError.message : 'Erro desconhecido' 
        });
        
      }

      logger.info('[AUTH] Senha resetada com sucesso', { userId: user.id });

      return {
        message: 'Senha alterada com sucesso. Faça login com sua nova senha.'
      };
    } catch (error) {
      logger.error('[AUTH] Erro ao resetar senha', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
      throw error;
    }
  }
}

