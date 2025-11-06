import { injectable, inject } from 'tsyringe';
import { UserRegisterDTO, UserLoginDTO, UserResponseDTO, RequestPasswordResetDTO, ResetPasswordDTO } from '../dtos';
import { AuthenticationService } from './AuthenticationService';
import { UserRegistrationService } from './UserRegistrationService';
import { PasswordManagementService } from './PasswordManagementService';
import { TokenManagementService } from './TokenManagementService';


@injectable()
export class AuthService {
  constructor(
    private authenticationService: AuthenticationService,
    private userRegistrationService: UserRegistrationService,
    private passwordManagementService: PasswordManagementService,
    private tokenManagementService: TokenManagementService
  ) {}

  /**
   * @deprecated Use UserRegistrationService.registerWithInvite()
   */
  async registerWithInvite(dto: UserRegisterDTO): Promise<{
    user: UserResponseDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    return this.userRegistrationService.registerWithInvite(dto);
  }

  /**
   * @deprecated Use AuthenticationService.loginWithEmail()
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
    return this.authenticationService.loginWithEmail(dto, ipAddress, userAgent);
  }

  /**
   * @deprecated Use TokenManagementService.refreshToken()
   */
  async refreshToken(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.tokenManagementService.refreshToken(oldRefreshToken);
  }

  /**
   * @deprecated Use AuthenticationService.logout()
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    return this.authenticationService.logout(accessToken, refreshToken);
  }

  /**
   * @deprecated Use AuthenticationService.logoutAllDevices()
   */
  async logoutAllDevices(userId: string): Promise<void> {
    return this.authenticationService.logoutAllDevices(userId);
  }

  /**
   * @deprecated Use PasswordManagementService.requestPasswordReset()
   */
  async requestPasswordReset(dto: RequestPasswordResetDTO): Promise<{ message: string }> {
    return this.passwordManagementService.requestPasswordReset(dto);
  }

  /**
   * @deprecated Use PasswordManagementService.resetPassword()
   */
  async resetPassword(dto: ResetPasswordDTO): Promise<{ message: string }> {
    return this.passwordManagementService.resetPassword(dto);
  }
}

