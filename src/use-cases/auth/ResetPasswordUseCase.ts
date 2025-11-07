import { injectable, inject } from 'tsyringe';
import { UserRepository } from '../../repositories';
import { ResetPasswordDTO } from '../../dtos';
import { PasswordResetService } from '../../services/PasswordResetService';
import { RefreshTokenService } from '../../services/RefreshTokenService';
import { EmailService } from '../../services/EmailService';
import { logger, TokenError, UnauthorizedError } from '../../utils';
import { IUseCase } from '../interfaces/IUseCase';

/**
 * Use Case: Reset password with token
 * 
 * Responsibilities:
 * - Validate reset token
 * - Check user exists
 * - Update password
 * - Mark token as used
 * - Revoke all refresh tokens (security)
 * - Send confirmation email
 * 
 * Business rules:
 * - Token must be valid and not expired
 * - Password must meet minimum requirements
 * - Invalidates all active sessions after reset
 */
@injectable()
export class ResetPasswordUseCase implements IUseCase<ResetPasswordDTO, { message: string }> {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(PasswordResetService) private passwordResetService: PasswordResetService,
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService,
    @inject(EmailService) private emailService: EmailService
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<{ message: string }> {
    try {
      // Validate token
      const resetToken = await this.passwordResetService.validateToken(dto.token);

      if (!resetToken) {
        throw new TokenError('Token is invalid or expired', 'INVALID_RESET_TOKEN');
      }

      // Find user
      const user = await this.userRepository.findById(resetToken.userId);
      if (!user) {
        throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
      }

      // Update password
      await user.setPassword(dto.newPassword);
      await this.userRepository.save(user);

      // Mark token as used and revoke
      await this.passwordResetService.markTokenAsUsed(resetToken);
      await this.passwordResetService.revokeToken(resetToken);

      // Revoke all active sessions (security)
      await this.refreshTokenService.revokeAllUserTokens(user.id);

      // Send confirmation email
      try {
        await this.emailService.sendPasswordResetConfirmation(user.email, user.name);
        logger.info('[PASSWORD] Confirmation email sent', { email: user.email });
      } catch (emailError) {
        logger.error('[PASSWORD] Error sending confirmation email', { 
          email: user.email, 
          error: emailError instanceof Error ? emailError.message : 'Unknown error' 
        });
        // Do not fail operation if confirmation email fails
      }

      logger.info('[PASSWORD] Password reset successfully', { userId: user.id });

      return {
        message: 'Password changed successfully. Log in with your new password.'
      };
    } catch (error) {
      logger.error('[PASSWORD] Error resetting password', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}
