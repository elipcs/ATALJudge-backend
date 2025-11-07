/**
 * @module services/PasswordManagementService
 * @description Service to manage user password requests and resets.
 * Provides operations to generate reset tokens, validate tokens,
 * process password resets and send notification emails.
 * @class PasswordManagementService
 */
import { injectable, inject } from 'tsyringe';
import { UserRepository } from '../repositories';
import { RequestPasswordResetDTO, ResetPasswordDTO } from '../dtos';
import { PasswordResetService } from './PasswordResetService';
import { RefreshTokenService } from './RefreshTokenService';
import { EmailService } from './EmailService';
import { logger, TokenError, UnauthorizedError, InternalServerError } from '../utils';


@injectable()
export class PasswordManagementService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(PasswordResetService) private passwordResetService: PasswordResetService,
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService,
    @inject(EmailService) private emailService: EmailService
  ) {}


  async requestPasswordReset(dto: RequestPasswordResetDTO): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findByEmail(dto.email);

      if (!user) {
        logger.warn('[PASSWORD] Tentativa de reset para email não cadastrado', { email: dto.email });
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
        logger.info('[PASSWORD] Email de reset enviado', { email: user.email });
      } catch (emailError) {
        logger.error('[PASSWORD] Erro ao enviar email de reset', { 
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
      logger.error('[PASSWORD] Erro ao processar solicitação de reset', { 
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
        logger.info('[PASSWORD] Email de confirmação enviado', { email: user.email });
      } catch (emailError) {
        logger.error('[PASSWORD] Erro ao enviar email de confirmação', { 
          email: user.email, 
          error: emailError instanceof Error ? emailError.message : 'Erro desconhecido' 
        });
      }

      logger.info('[PASSWORD] Senha resetada com sucesso', { userId: user.id });

      return {
        message: 'Senha alterada com sucesso. Faça login com sua nova senha.'
      };
    } catch (error) {
      logger.error('[PASSWORD] Erro ao resetar senha', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
      throw error;
    }
  }
}
