import { injectable, inject } from 'tsyringe';
import { UserRepository } from '../../repositories';
import { RequestPasswordResetDTO } from '../../dtos';
import { PasswordResetService } from '../../services/PasswordResetService';
import { EmailService } from '../../services/EmailService';
import { logger, InternalServerError } from '../../utils';
import { IUseCase } from '../interfaces/IUseCase';

/**
 * Use Case: Request password reset
 * 
 * Responsibilities:
 * - Find user by email
 * - Revoke previous reset tokens
 * - Create new reset token
 * - Send email with instructions
 * 
 * Business rules:
 * - Always returns generic message (security)
 * - Revokes previous tokens to prevent multiple attempts
 * - Token expires in 1 hour
 */
@injectable()
export class RequestPasswordResetUseCase implements IUseCase<RequestPasswordResetDTO, { message: string }> {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(PasswordResetService) private passwordResetService: PasswordResetService,
    @inject(EmailService) private emailService: EmailService
  ) {}

  async execute(dto: RequestPasswordResetDTO): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findByEmail(dto.email);

      if (!user) {
        logger.warn('[PASSWORD] Password reset attempt for unregistered email', { email: dto.email });
        return {
          message: 'If the email is registered, you will receive instructions to reset your password.'
        };
      }

      // Revoke previous tokens
      await this.passwordResetService.revokeAllUserTokens(user.id);

      // Create new token (expires in 1 hour)
      const resetToken = await this.passwordResetService.createResetToken(user.id, 1);

      // Send email
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.name,
          resetToken
        );
        logger.info('[PASSWORD] Reset email sent', { email: user.email });
      } catch (emailError) {
        logger.error('[PASSWORD] Error sending reset email', { 
          email: user.email, 
          error: emailError instanceof Error ? emailError.message : 'Unknown error' 
        });
        
        // Revoke token if email fails
        await this.passwordResetService.revokeAllUserTokens(user.id);
        throw new InternalServerError('Error sending email. Try again later.', 'EMAIL_ERROR');
      }

      // Return generic message for security
      return {
        message: 'If the email is registered, you will receive instructions to reset your password.'
      };
    } catch (error) {
      logger.error('[PASSWORD] Error processing reset request', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}
