/**
 * Dependency Injection Container Configuration
 * 
 * Registers all repositories, services, and use cases with the tsyringe container.
 * Implements the Singleton pattern for application-wide dependency management.
 * 
 * @module config/container
 * @see {@link https://github.com/Microsoft/tsyringe tsyringe documentation}
 */
import 'reflect-metadata';
import { container } from 'tsyringe';

import { UserRepository } from '../repositories/UserRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { SubmissionRepository } from '../repositories/SubmissionRepository';
import { SubmissionResultRepository } from '../repositories/SubmissionResultRepository';
import { InviteRepository } from '../repositories/InviteRepository';
import { TestCaseRepository } from '../repositories/TestCaseRepository';
import { GradeRepository } from '../repositories/GradeRepository';
import { ClassRepository } from '../repositories/ClassRepository';
import { QuestionListRepository } from '../repositories/QuestionListRepository';
import { TokenBlacklistRepository } from '../repositories/TokenBlacklistRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { PasswordResetTokenRepository } from '../repositories/PasswordResetTokenRepository';
import { AllowedIPRepository } from '../repositories/AllowedIPRepository';

import { EmailService } from '../services/EmailService';
import { Judge0Service } from '../services/Judge0Service';
import { PasswordResetService } from '../services/PasswordResetService';
import { RefreshTokenService } from '../services/RefreshTokenService';
import { InviteService } from '../services/InviteService';
import { UserService } from '../services/UserService';
import { TestCaseService } from '../services/TestCaseService';
import { QuestionService } from '../services/QuestionService';
import { ClassService } from '../services/ClassService';
import { GradeService } from '../services/GradeService';
import { QuestionListService } from '../services/QuestionListService';
import { SubmissionService } from '../services/SubmissionService';
import { AllowedIPService } from '../services/AllowedIPService';
import { SystemResetService } from '../services/SystemResetService';
import { SubmissionQueueService } from '../services/SubmissionQueueService';
import { AuthenticationService } from '../services/AuthenticationService';
import { UserRegistrationService } from '../services/UserRegistrationService';
import { PasswordManagementService } from '../services/PasswordManagementService';
import { TokenManagementService } from '../services/TokenManagementService';

/**
 * Sets up the dependency injection container
 * 
 * Registers all repositories and services as singletons.
 * This function must be called during application initialization.
 * 
 * @returns {void}
 * @example
 * setupContainer();
 */
export function setupContainer(): void {
  container.registerSingleton(UserRepository);
  container.registerSingleton(QuestionRepository);
  container.registerSingleton(SubmissionRepository);
  container.registerSingleton(SubmissionResultRepository);
  container.registerSingleton(InviteRepository);
  container.registerSingleton(TestCaseRepository);
  container.registerSingleton(GradeRepository);
  container.registerSingleton(ClassRepository);
  container.registerSingleton(QuestionListRepository);
  container.registerSingleton(TokenBlacklistRepository);
  container.registerSingleton(RefreshTokenRepository);
  container.registerSingleton(PasswordResetTokenRepository);
  container.registerSingleton(AllowedIPRepository);

  container.registerSingleton(EmailService);
  container.registerSingleton(Judge0Service);
  container.registerSingleton(PasswordResetService);
  container.registerSingleton(RefreshTokenService);
  container.registerSingleton(InviteService);
  container.registerSingleton(UserService);
  container.registerSingleton(TestCaseService);
  container.registerSingleton(QuestionService);
  container.registerSingleton(ClassService);
  container.registerSingleton(GradeService);
  container.registerSingleton(QuestionListService);
  container.registerSingleton(AllowedIPService);
  container.registerSingleton(SystemResetService);
  container.registerSingleton(AuthenticationService);
  container.registerSingleton(UserRegistrationService);
  container.registerSingleton(PasswordManagementService);
  container.registerSingleton(TokenManagementService);
  container.registerSingleton(SubmissionQueueService);
  container.register('SubmissionQueueService', { useToken: SubmissionQueueService });
  container.registerSingleton(SubmissionService);
}

export { container };
