import 'reflect-metadata';
import { container } from 'tsyringe';

// Repositórios
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

// Services
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
import { AuthService } from '../services/AuthService';
import { QuestionListService } from '../services/QuestionListService';
import { SubmissionService } from '../services/SubmissionService';
import { AllowedIPService } from '../services/AllowedIPService';
import { SystemResetService } from '../services/SystemResetService';
import { SubmissionQueueService } from '../services/SubmissionQueueService';

/**
 * Configura o container de injeção de dependências usando tsyringe
 * 
 * IMPORTANTE: A ordem de registro não importa para tsyringe, pois ele resolve
 * dependências automaticamente através dos decorators @injectable e @inject
 */
export function setupContainer(): void {
  // Registrar repositórios (singleton)
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

  // Registrar services básicos (singleton)
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
  container.registerSingleton(AuthService);
  container.registerSingleton(QuestionListService);
  container.registerSingleton(AllowedIPService);
  container.registerSingleton(SystemResetService);

  // Registrar SubmissionQueueService
  // O serviço usa process.env diretamente para configuração do Redis
  container.registerSingleton(SubmissionQueueService);
  container.register('SubmissionQueueService', { useToken: SubmissionQueueService });

  // Registrar SubmissionService (precisa do QueueService opcional)
  container.registerSingleton(SubmissionService);
}

/**
 * Obtém uma instância do container
 */
export { container };
