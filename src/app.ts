/**
 * Express Application Factory
 * 
 * Creates and configures the Express application with all routes, middlewares,
 * and error handling.
 * 
 * Features:
 * - CORS and security headers (Helmet)
 * - Rate limiting
 * - Request validation
 * - Error handling
 * - All API routes
 * 
 * @module app
 */
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, container } from './config';
import { logger } from './utils';
import { errorHandler, notFoundHandler } from './middlewares';

import createAuthController from './controllers/auth.controller';
import createUserController from './controllers/user.controller';
import createInviteController from './controllers/invite.controller';
import createQuestionController from './controllers/question.controller';
import createClassController from './controllers/class.controller';
import createSubmissionController from './controllers/submission.controller';
import createTestCaseController from './controllers/testcase.controller';
import createQuestionListController from './controllers/questionlist.controller';
import createGradeController from './controllers/grade.controller';
import createConfigController from './controllers/config.controller';

import { SubmissionService } from './services/SubmissionService';

// Use Cases
import {
  LoginUseCase,
  RegisterUserUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase
} from './use-cases/auth';
import { GetUserUseCase, GetUsersByRoleUseCase, UpdateProfileUseCase, ChangePasswordUseCase } from './use-cases/user';
import { CreateQuestionUseCase, UpdateQuestionUseCase, UpdateCodeforcesFieldsUseCase, DeleteQuestionUseCase, GetQuestionByIdUseCase, GetAllQuestionsUseCase, GetQuestionsByAuthorUseCase, SearchQuestionsUseCase } from './use-cases/question';
import { CreateSubmissionUseCase, GetSubmissionUseCase, GetAllSubmissionsUseCase, GetSubmissionWithResultsUseCase, ResubmitSubmissionUseCase } from './use-cases/submission';
import { GetGradeUseCase, CalculateGradeUseCase, GetStudentGradesUseCase, GetListGradesUseCase, GetGradeByStudentAndListUseCase } from './use-cases/grade';
import { CreateQuestionListUseCase, GetQuestionListUseCase, UpdateQuestionListUseCase, DeleteQuestionListUseCase, GetAllQuestionListsUseCase, UpdateListScoringUseCase, AddQuestionToListUseCase, RemoveQuestionFromListUseCase } from './use-cases/question-list';
import { CreateInviteUseCase, GetAllInvitesUseCase, ValidateInviteUseCase, DeleteInviteUseCase, RevokeInviteUseCase } from './use-cases/invite';
import {
  CreateClassUseCase,
  GetAllClassesUseCase,
  GetClassByIdUseCase,
  UpdateClassUseCase,
  DeleteClassUseCase,
  GetClassStudentsUseCase,
  AddStudentToClassUseCase,
  RemoveStudentFromClassUseCase
} from './use-cases/class';
import {
  CreateTestCaseUseCase,
  GetTestCasesByQuestionUseCase,
  GetTestCaseByIdUseCase,
  UpdateTestCaseUseCase,
  DeleteTestCaseUseCase
} from './use-cases/testcase';
import { BulkUpdateTestCasesUseCase } from './use-cases/testcase/BulkUpdateTestCasesUseCase';
import { GenerateTestCasesUseCase } from './use-cases/testcase/GenerateTestCasesUseCase';
import {
  GetAllAllowedIPsUseCase,
  GetAllowedIPByIdUseCase,
  CreateAllowedIPUseCase,
  ToggleAllowedIPStatusUseCase,
  DeleteAllowedIPUseCase
} from './use-cases/allowed-ip';
import { PerformSystemResetUseCase } from './use-cases/system-reset';

export function createApp(): Application {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  }));

  app.use(cors({
    origin: function (origin, callback) {

      const isProduction = config.nodeEnv === 'production';

      if (!origin) {
        if (isProduction) {
          return callback(new Error('Origem não permitida'), false);
        }
        return callback(null, true);
      }

      const allowedOrigins = config.allowedOrigins.length > 0
        ? config.allowedOrigins
        : [
          config.frontendUrl,
          ...(!isProduction ? [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174'
          ] : [])
        ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('[CORS] Origem bloqueada', { origin, isProduction });
        if (isProduction) {
          callback(new Error('Origem não permitida'), false);
        } else {

          callback(null, true);
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      logger.error('[JSON] Invalid JSON received', { error: err });
      return res.status(400).json({
        success: false,
        message: 'Invalid data - Malformed JSON',
        error: 'INVALID_JSON'
      });
    }
    return next(err);
  });

  const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', generalLimiter);

  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.path}`);
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  const loginUseCase = container.resolve(LoginUseCase);
  const registerUserUseCase = container.resolve(RegisterUserUseCase);
  const refreshTokenUseCase = container.resolve(RefreshTokenUseCase);
  const logoutUseCase = container.resolve(LogoutUseCase);
  const requestPasswordResetUseCase = container.resolve(RequestPasswordResetUseCase);
  const resetPasswordUseCase = container.resolve(ResetPasswordUseCase);
  const getUserUseCase = container.resolve(GetUserUseCase);
  const getUsersByRoleUseCase = container.resolve(GetUsersByRoleUseCase);
  const updateProfileUseCase = container.resolve(UpdateProfileUseCase);
  const changePasswordUseCase = container.resolve(ChangePasswordUseCase);
  const createQuestionUseCase = container.resolve(CreateQuestionUseCase);
  const updateQuestionUseCase = container.resolve(UpdateQuestionUseCase);
  const updateCodeforcesFieldsUseCase = container.resolve(UpdateCodeforcesFieldsUseCase);
  const deleteQuestionUseCase = container.resolve(DeleteQuestionUseCase);
  const getQuestionByIdUseCase = container.resolve(GetQuestionByIdUseCase);
  const getAllQuestionsUseCase = container.resolve(GetAllQuestionsUseCase);
  const getQuestionsByAuthorUseCase = container.resolve(GetQuestionsByAuthorUseCase);
  const searchQuestionsUseCase = container.resolve(SearchQuestionsUseCase);
  const createSubmissionUseCase = container.resolve(CreateSubmissionUseCase);
  const getSubmissionUseCase = container.resolve(GetSubmissionUseCase);
  const getAllSubmissionsUseCase = container.resolve(GetAllSubmissionsUseCase);
  const getSubmissionWithResultsUseCase = container.resolve(GetSubmissionWithResultsUseCase);
  const resubmitSubmissionUseCase = container.resolve(ResubmitSubmissionUseCase);
  const getGradeUseCase = container.resolve(GetGradeUseCase);
  const calculateGradeUseCase = container.resolve(CalculateGradeUseCase);
  const getStudentGradesUseCase = container.resolve(GetStudentGradesUseCase);
  const getListGradesUseCase = container.resolve(GetListGradesUseCase);
  const getGradeByStudentAndListUseCase = container.resolve(GetGradeByStudentAndListUseCase);
  const createQuestionListUseCase = container.resolve(CreateQuestionListUseCase);
  const getQuestionListUseCase = container.resolve(GetQuestionListUseCase);
  const updateQuestionListUseCase = container.resolve(UpdateQuestionListUseCase);
  const deleteQuestionListUseCase = container.resolve(DeleteQuestionListUseCase);
  const getAllQuestionListsUseCase = container.resolve(GetAllQuestionListsUseCase);
  const updateListScoringUseCase = container.resolve(UpdateListScoringUseCase);
  const addQuestionToListUseCase = container.resolve(AddQuestionToListUseCase);
  const removeQuestionFromListUseCase = container.resolve(RemoveQuestionFromListUseCase);
  const createInviteUseCase = container.resolve(CreateInviteUseCase);
  const getAllInvitesUseCase = container.resolve(GetAllInvitesUseCase);
  const validateInviteUseCase = container.resolve(ValidateInviteUseCase);
  const deleteInviteUseCase = container.resolve(DeleteInviteUseCase);
  const revokeInviteUseCase = container.resolve(RevokeInviteUseCase);
  const createClassUseCase = container.resolve(CreateClassUseCase);
  const getAllClassesUseCase = container.resolve(GetAllClassesUseCase);
  const getClassByIdUseCase = container.resolve(GetClassByIdUseCase);
  const updateClassUseCase = container.resolve(UpdateClassUseCase);
  const deleteClassUseCase = container.resolve(DeleteClassUseCase);
  const getClassStudentsUseCase = container.resolve(GetClassStudentsUseCase);
  const addStudentToClassUseCase = container.resolve(AddStudentToClassUseCase);
  const removeStudentFromClassUseCase = container.resolve(RemoveStudentFromClassUseCase);
  const createTestCaseUseCase = container.resolve(CreateTestCaseUseCase);
  const getTestCasesByQuestionUseCase = container.resolve(GetTestCasesByQuestionUseCase);
  const getTestCaseByIdUseCase = container.resolve(GetTestCaseByIdUseCase);
  const updateTestCaseUseCase = container.resolve(UpdateTestCaseUseCase);
  const deleteTestCaseUseCase = container.resolve(DeleteTestCaseUseCase);
  const bulkUpdateTestCasesUseCase = container.resolve(BulkUpdateTestCasesUseCase);
  const generateTestCasesUseCase = container.resolve(GenerateTestCasesUseCase);
  const getAllAllowedIPsUseCase = container.resolve(GetAllAllowedIPsUseCase);
  const getAllowedIPByIdUseCase = container.resolve(GetAllowedIPByIdUseCase);
  const createAllowedIPUseCase = container.resolve(CreateAllowedIPUseCase);
  const toggleAllowedIPStatusUseCase = container.resolve(ToggleAllowedIPStatusUseCase);
  const deleteAllowedIPUseCase = container.resolve(DeleteAllowedIPUseCase);
  const performSystemResetUseCase = container.resolve(PerformSystemResetUseCase);

  const submissionService = container.resolve(SubmissionService);

  app.use('/api/auth', createAuthController(
    loginUseCase,
    registerUserUseCase,
    refreshTokenUseCase,
    logoutUseCase,
    requestPasswordResetUseCase,
    resetPasswordUseCase
  ));

  app.use('/api/users', createUserController(
    getUserUseCase,
    getUsersByRoleUseCase,
    updateProfileUseCase,
    changePasswordUseCase
  ));

  app.use('/api/invites', createInviteController(
    createInviteUseCase,
    getAllInvitesUseCase,
    validateInviteUseCase,
    deleteInviteUseCase,
    revokeInviteUseCase
  ));

  app.use('/api', createTestCaseController(
    createTestCaseUseCase,
    getTestCasesByQuestionUseCase,
    getTestCaseByIdUseCase,
    updateTestCaseUseCase,
    deleteTestCaseUseCase,
    bulkUpdateTestCasesUseCase,
    generateTestCasesUseCase
  ));

  app.use('/api/questions', createQuestionController(
    createQuestionUseCase,
    updateQuestionUseCase,
    updateCodeforcesFieldsUseCase,
    deleteQuestionUseCase,
    getQuestionByIdUseCase,
    getAllQuestionsUseCase,
    getQuestionsByAuthorUseCase,
    searchQuestionsUseCase
  ));
  app.use('/api/classes', createClassController(
    createClassUseCase,
    getAllClassesUseCase,
    getClassByIdUseCase,
    updateClassUseCase,
    deleteClassUseCase,
    getClassStudentsUseCase,
    addStudentToClassUseCase,
    removeStudentFromClassUseCase
  ));
  app.use('/api/submissions', createSubmissionController(
    submissionService,
    createSubmissionUseCase,
    getSubmissionUseCase,
    getAllSubmissionsUseCase,
    getSubmissionWithResultsUseCase,
    resubmitSubmissionUseCase
  ));
  app.use('/api/lists', createQuestionListController(
    createQuestionListUseCase,
    getQuestionListUseCase,
    updateQuestionListUseCase,
    deleteQuestionListUseCase,
    getAllQuestionListsUseCase,
    updateListScoringUseCase,
    addQuestionToListUseCase,
    removeQuestionFromListUseCase
  ));
  app.use('/api/grades', createGradeController(
    getGradeUseCase,
    calculateGradeUseCase,
    getStudentGradesUseCase,
    getListGradesUseCase,
    getGradeByStudentAndListUseCase
  ));
  app.use('/api/config', createConfigController(
    getAllAllowedIPsUseCase,
    getAllowedIPByIdUseCase,
    createAllowedIPUseCase,
    toggleAllowedIPStatusUseCase,
    deleteAllowedIPUseCase,
    performSystemResetUseCase
  ));

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}

