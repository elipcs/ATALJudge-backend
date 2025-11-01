import { UserRepository, TokenBlacklistRepository } from '../repositories';
import { TokenManager, JwtPayload } from '../utils/TokenManager';
import { UserRegisterDTO, UserLoginDTO, UserResponseDTO, RequestPasswordResetDTO, ResetPasswordDTO } from '../dtos';
import { RefreshTokenService } from './RefreshTokenService';
import { PasswordResetService } from './PasswordResetService';
import { EmailService } from './EmailService';
import { config } from '../config';
import { UserRole } from '../enums/UserRole';
import { logger, ConflictError, UnauthorizedError, TokenError, InternalServerError } from '../utils';
import { User } from '../models/User';

/**
 * Serviço de autenticação
 */
export class AuthService {
  private userRepository: UserRepository;
  private refreshTokenService: RefreshTokenService;
  private passwordResetService: PasswordResetService;
  private emailService: EmailService;
  private tokenBlacklistRepository: TokenBlacklistRepository;

  constructor(
    userRepository: UserRepository,
    refreshTokenService: RefreshTokenService,
    passwordResetService: PasswordResetService,
    emailService: EmailService,
    tokenBlacklistRepository: TokenBlacklistRepository
  ) {
    this.userRepository = userRepository;
    this.refreshTokenService = refreshTokenService;
    this.passwordResetService = passwordResetService;
    this.emailService = emailService;
    this.tokenBlacklistRepository = tokenBlacklistRepository;
  }

  /**
   * Registra um novo usuário
   */
  async registerWithInvite(dto: UserRegisterDTO): Promise<{
    user: UserResponseDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    // Verificar se email já está em uso
    const emailExists = await this.userRepository.emailExists(dto.email);
    if (emailExists) {
      throw new ConflictError('Email já está em uso', 'EMAIL_IN_USE');
    }

    // O frontend já validou o token e enviou role e classId
    const userRole = dto.role || UserRole.STUDENT;

    // Criar usuário
    const user = new User();
    user.name = dto.name;
    user.email = dto.email.toLowerCase();
    user.role = userRole;
    await user.setPassword(dto.password);

    const savedUser = await this.userRepository.create(user);

    // Gerar tokens
    const payload: JwtPayload = {
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    };

    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    // Salvar refresh token com hash
    await this.refreshTokenService.saveRefreshToken(
      savedUser.id,
      refreshToken,
      config.jwt.refreshExpires
    );
    
    // Limitar número de tokens ativos
    await this.refreshTokenService.enforceTokenLimit(savedUser.id, 5);

    return {
      user: new UserResponseDTO(savedUser),
      accessToken,
      refreshToken
    };
  }

  /**
   * Login com email e senha
   */
  async loginWithEmail(
    dto: UserLoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: UserResponseDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    // Buscar usuário
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Email ou senha incorretos', 'INVALID_CREDENTIALS');
    }

    // Verificar senha
    const isPasswordValid = await user.checkPassword(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email ou senha incorretos', 'INVALID_CREDENTIALS');
    }

    // Atualizar último login
    await this.userRepository.updateLastLogin(user.id);

    // Gerar tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    // Log para debug - verificar tamanho do token gerado
    logger.debug('[LOGIN] Tokens gerados', {
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
      userId: user.id
    });

    // Salvar refresh token com hash
    await this.refreshTokenService.saveRefreshToken(
      user.id,
      refreshToken,
      config.jwt.refreshExpires,
      ipAddress,
      userAgent
    );
    
    // Limitar número de tokens ativos
    await this.refreshTokenService.enforceTokenLimit(user.id, 5);

    return {
      user: new UserResponseDTO(user),
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh token com rotação e proteção contra roubo
   */
  async refreshToken(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Validação prévia: JWT válido tem pelo menos 100 caracteres
    if (!oldRefreshToken || typeof oldRefreshToken !== 'string' || oldRefreshToken.length < 100) {
      throw new TokenError('Refresh token inválido: formato incorreto', 'INVALID_TOKEN_FORMAT');
    }
    
    // Verificar JWT
    const payload = TokenManager.verifyRefreshToken(oldRefreshToken);

    // Validar token no banco (detecta roubo)
    const storedToken = await this.refreshTokenService.validateAndUseToken(oldRefreshToken);

    // Revogar token antigo (rotation)
    await this.refreshTokenService.revokeToken(oldRefreshToken);

    // Gerar novos tokens
    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    // Salvar novo refresh token na mesma família
    await this.refreshTokenService.saveRefreshToken(
      payload.userId,
      refreshToken,
      config.jwt.refreshExpires,
      storedToken.ipAddress,
      storedToken.userAgent,
      storedToken.familyId // Mesma família para rastreamento
    );

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Logout (adiciona token à blacklist e revoga refresh token)
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {

    // Adicionar access token à blacklist (verifica validade)
    TokenManager.verifyAccessToken(accessToken);
    await this.tokenBlacklistRepository.create({
      token: accessToken,
      expiresAt: TokenManager.calculateExpirationDate(config.jwt.accessExpires),
      reason: 'logout'
    });

    // Se houver refresh token, revogar
    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    }
  }

  /**
   * Revoga todos os tokens de um usuário (logout de todos os dispositivos)
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  /**
   * Solicita reset de senha e envia email
   */
  async requestPasswordReset(dto: RequestPasswordResetDTO): Promise<{ message: string }> {
    try {
      // Buscar usuário pelo email
      const user = await this.userRepository.findByEmail(dto.email);
      
      // Por segurança, sempre retornar sucesso mesmo que o email não exista
      // Isso evita que atacantes descubram quais emails estão cadastrados
      if (!user) {
        logger.warn('[AUTH] Tentativa de reset para email não cadastrado', { email: dto.email });
        // Retornar mensagem genérica
        return {
          message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
        };
      }

      // Revogar tokens anteriores do usuário
      await this.passwordResetService.revokeAllUserTokens(user.id);

      // Gerar novo token de reset
      const resetToken = await this.passwordResetService.createResetToken(user.id, 1);

      // Enviar email
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
        // Revogar token já que o email falhou
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

  /**
   * Confirma reset de senha com token
   */
  async resetPassword(dto: ResetPasswordDTO): Promise<{ message: string }> {
    try {
      // Validar token
      const resetToken = await this.passwordResetService.validateToken(dto.token);

      if (!resetToken) {
        throw new TokenError('Token inválido ou expirado', 'INVALID_RESET_TOKEN');
      }

      // Buscar usuário
      const user = await this.userRepository.findById(resetToken.userId);
      if (!user) {
        throw new UnauthorizedError('Usuário não encontrado', 'USER_NOT_FOUND');
      }

      // Alterar senha
      await user.setPassword(dto.newPassword);
      
      // Salvar usuário
      await this.userRepository.save(user);

      // Marcar token como usado e remover
      await this.passwordResetService.markTokenAsUsed(resetToken);
      await this.passwordResetService.revokeToken(resetToken);

      // Revogar todos os tokens de refresh do usuário (forçar novo login)
      await this.refreshTokenService.revokeAllUserTokens(user.id);

      // Enviar email de confirmação
      try {
        await this.emailService.sendPasswordResetConfirmation(user.email, user.name);
        logger.info('[AUTH] Email de confirmação enviado', { email: user.email });
      } catch (emailError) {
        logger.error('[AUTH] Erro ao enviar email de confirmação', { 
          email: user.email, 
          error: emailError instanceof Error ? emailError.message : 'Erro desconhecido' 
        });
        // Não falhar a operação se o email de confirmação falhar
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

