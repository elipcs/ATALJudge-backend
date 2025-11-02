

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

import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { InviteService } from '../services/InviteService';
import { QuestionService } from '../services/QuestionService';
import { ClassService } from '../services/ClassService';
import { SubmissionService } from '../services/SubmissionService';
import { TestCaseService } from '../services/TestCaseService';
import { QuestionListService } from '../services/QuestionListService';
import { RefreshTokenService } from '../services/RefreshTokenService';
import { GradeService } from '../services/GradeService';
import { EmailService } from '../services/EmailService';
import { Judge0Service } from '../services/Judge0Service';
import { PasswordResetService } from '../services/PasswordResetService';
import { AllowedIPService } from '../services/AllowedIPService';
import { SystemResetService } from '../services/SystemResetService';

import createAuthController from '../controllers/auth.controller';
import createUserController from '../controllers/user.controller';
import createInviteController from '../controllers/invite.controller';
import createQuestionController from '../controllers/question.controller';
import createClassController from '../controllers/class.controller';
import createSubmissionController from '../controllers/submission.controller';
import createTestCaseController from '../controllers/testcase.controller';
import createQuestionListController from '../controllers/questionlist.controller';
import createGradeController from '../controllers/grade.controller';
import createConfigController from '../controllers/config.controller';
import { Router } from 'express';

class DIContainer {
  private static instance: DIContainer;

  private _userRepository?: UserRepository;
  private _questionRepository?: QuestionRepository;
  private _submissionRepository?: SubmissionRepository;
  private _submissionResultRepository?: SubmissionResultRepository;
  private _inviteRepository?: InviteRepository;
  private _testCaseRepository?: TestCaseRepository;
  private _gradeRepository?: GradeRepository;
  private _classRepository?: ClassRepository;
  private _questionListRepository?: QuestionListRepository;
  private _tokenBlacklistRepository?: TokenBlacklistRepository;
  private _refreshTokenRepository?: RefreshTokenRepository;
  private _passwordResetTokenRepository?: PasswordResetTokenRepository;
  private _allowedIPRepository?: AllowedIPRepository;

  private _emailService?: EmailService;
  private _judge0Service?: Judge0Service;
  private _passwordResetService?: PasswordResetService;
  private _refreshTokenService?: RefreshTokenService;
  private _authService?: AuthService;
  private _userService?: UserService;
  private _inviteService?: InviteService;
  private _questionService?: QuestionService;
  private _classService?: ClassService;
  private _submissionService?: SubmissionService;
  private _testCaseService?: TestCaseService;
  private _questionListService?: QuestionListService;
  private _gradeService?: GradeService;
  private _allowedIPService?: AllowedIPService;
  private _systemResetService?: SystemResetService;

  private _authController?: Router;
  private _userController?: Router;
  private _inviteController?: Router;
  private _questionController?: Router;
  private _classController?: Router;
  private _submissionController?: Router;
  private _testCaseController?: Router;
  private _questionListController?: Router;
  private _gradeController?: Router;
  private _configController?: Router;

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  get questionRepository(): QuestionRepository {
    if (!this._questionRepository) {
      this._questionRepository = new QuestionRepository();
    }
    return this._questionRepository;
  }

  get submissionRepository(): SubmissionRepository {
    if (!this._submissionRepository) {
      this._submissionRepository = new SubmissionRepository();
    }
    return this._submissionRepository;
  }

  get submissionResultRepository(): SubmissionResultRepository {
    if (!this._submissionResultRepository) {
      this._submissionResultRepository = new SubmissionResultRepository();
    }
    return this._submissionResultRepository;
  }

  get inviteRepository(): InviteRepository {
    if (!this._inviteRepository) {
      this._inviteRepository = new InviteRepository();
    }
    return this._inviteRepository;
  }

  get testCaseRepository(): TestCaseRepository {
    if (!this._testCaseRepository) {
      this._testCaseRepository = new TestCaseRepository();
    }
    return this._testCaseRepository;
  }

  get gradeRepository(): GradeRepository {
    if (!this._gradeRepository) {
      this._gradeRepository = new GradeRepository();
    }
    return this._gradeRepository;
  }

  get classRepository(): ClassRepository {
    if (!this._classRepository) {
      this._classRepository = new ClassRepository();
    }
    return this._classRepository;
  }

  get questionListRepository(): QuestionListRepository {
    if (!this._questionListRepository) {
      this._questionListRepository = new QuestionListRepository();
    }
    return this._questionListRepository;
  }

  get tokenBlacklistRepository(): TokenBlacklistRepository {
    if (!this._tokenBlacklistRepository) {
      this._tokenBlacklistRepository = new TokenBlacklistRepository();
    }
    return this._tokenBlacklistRepository;
  }

  get refreshTokenRepository(): RefreshTokenRepository {
    if (!this._refreshTokenRepository) {
      this._refreshTokenRepository = new RefreshTokenRepository();
    }
    return this._refreshTokenRepository;
  }

  get passwordResetTokenRepository(): PasswordResetTokenRepository {
    if (!this._passwordResetTokenRepository) {
      this._passwordResetTokenRepository = new PasswordResetTokenRepository();
    }
    return this._passwordResetTokenRepository;
  }

  get allowedIPRepository(): AllowedIPRepository {
    if (!this._allowedIPRepository) {
      this._allowedIPRepository = new AllowedIPRepository();
    }
    return this._allowedIPRepository;
  }

  get emailService(): EmailService {
    if (!this._emailService) {
      this._emailService = new EmailService();
    }
    return this._emailService;
  }

  get judge0Service(): Judge0Service {
    if (!this._judge0Service) {
      this._judge0Service = new Judge0Service();
    }
    return this._judge0Service;
  }

  get passwordResetService(): PasswordResetService {
    if (!this._passwordResetService) {
      this._passwordResetService = new PasswordResetService(this.passwordResetTokenRepository);
    }
    return this._passwordResetService;
  }

  get refreshTokenService(): RefreshTokenService {
    if (!this._refreshTokenService) {
      this._refreshTokenService = new RefreshTokenService(this.refreshTokenRepository);
    }
    return this._refreshTokenService;
  }

  get authService(): AuthService {
    if (!this._authService) {
      this._authService = new AuthService(
        this.userRepository,
        this.refreshTokenService,
        this.passwordResetService,
        this.emailService,
        this.tokenBlacklistRepository
      );
    }
    return this._authService;
  }

  get userService(): UserService {
    if (!this._userService) {
      this._userService = new UserService(this.userRepository);
    }
    return this._userService;
  }

  get inviteService(): InviteService {
    if (!this._inviteService) {
      this._inviteService = new InviteService(this.inviteRepository);
    }
    return this._inviteService;
  }

  get questionService(): QuestionService {
    if (!this._questionService) {
      this._questionService = new QuestionService(this.questionRepository);
    }
    return this._questionService;
  }

  get classService(): ClassService {
    if (!this._classService) {
      this._classService = new ClassService(
        this.classRepository,
        this.userRepository
      );
    }
    return this._classService;
  }

  get submissionService(): SubmissionService {
    if (!this._submissionService) {
      this._submissionService = new SubmissionService(
        this.submissionRepository,
        this.submissionResultRepository,
        this.questionRepository,
        this.testCaseRepository,
        this.judge0Service
      );
    }
    return this._submissionService;
  }

  get testCaseService(): TestCaseService {
    if (!this._testCaseService) {
      this._testCaseService = new TestCaseService(this.testCaseRepository);
    }
    return this._testCaseService;
  }

  get questionListService(): QuestionListService {
    if (!this._questionListService) {
      this._questionListService = new QuestionListService(
        this.questionListRepository,
        this.questionRepository,
        this.classRepository
      );
    }
    return this._questionListService;
  }

  get gradeService(): GradeService {
    if (!this._gradeService) {
      this._gradeService = new GradeService(
        this.gradeRepository,
        this.userRepository,
        this.questionListRepository
      );
    }
    return this._gradeService;
  }

  get allowedIPService(): AllowedIPService {
    if (!this._allowedIPService) {
      this._allowedIPService = new AllowedIPService(this.allowedIPRepository);
    }
    return this._allowedIPService;
  }

  get systemResetService(): SystemResetService {
    if (!this._systemResetService) {
      this._systemResetService = new SystemResetService(
        this.submissionRepository,
        this.userRepository,
        this.classRepository,
        this.questionListRepository,
        this.inviteRepository
      );
    }
    return this._systemResetService;
  }

  get authController(): Router {
    if (!this._authController) {
      this._authController = createAuthController(this.authService);
    }
    return this._authController;
  }

  get userController(): Router {
    if (!this._userController) {
      this._userController = createUserController(this.userService);
    }
    return this._userController;
  }

  get inviteController(): Router {
    if (!this._inviteController) {
      this._inviteController = createInviteController(this.inviteService);
    }
    return this._inviteController;
  }

  get questionController(): Router {
    if (!this._questionController) {
      this._questionController = createQuestionController(this.questionService);
    }
    return this._questionController;
  }

  get classController(): Router {
    if (!this._classController) {
      this._classController = createClassController(this.classService);
    }
    return this._classController;
  }

  get submissionController(): Router {
    if (!this._submissionController) {
      this._submissionController = createSubmissionController(this.submissionService);
    }
    return this._submissionController;
  }

  get testCaseController(): Router {
    if (!this._testCaseController) {
      this._testCaseController = createTestCaseController(this.testCaseService);
    }
    return this._testCaseController;
  }

  get questionListController(): Router {
    if (!this._questionListController) {
      this._questionListController = createQuestionListController(this.questionListService);
    }
    return this._questionListController;
  }

  get gradeController(): Router {
    if (!this._gradeController) {
      this._gradeController = createGradeController(this.gradeService);
    }
    return this._gradeController;
  }

  get configController(): Router {
    if (!this._configController) {
      this._configController = createConfigController(
        this.allowedIPService,
        this.systemResetService
      );
    }
    return this._configController;
  }
}

export const container = DIContainer.getInstance();

