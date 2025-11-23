/**
 * @module controllers/submission
 * @description REST API controller for submission endpoints
 * Manages submission creation, retrieval, and result handling
 * @class SubmissionController
 */
import { Router, Response } from 'express';
import { SubmissionService } from '../services/SubmissionService';
import { CreateSubmissionUseCase, GetSubmissionUseCase, GetAllSubmissionsUseCase, GetSubmissionWithResultsUseCase, ResubmitSubmissionUseCase, SearchSubmissionsUseCase } from '../use-cases/submission';
import { CreateSubmissionDTO } from '../dtos';
import { validateBody, authenticate, AuthRequest, requireTeacher } from '../middlewares';
import { successResponse } from '../utils/responses';
import { SubmissionStatus, UserRole } from '../enums';
import { UnauthorizedError, ValidationError } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createSubmissionController(
  submissionService: SubmissionService,
  createSubmissionUseCase: CreateSubmissionUseCase,
  getSubmissionUseCase: GetSubmissionUseCase,
  getAllSubmissionsUseCase: GetAllSubmissionsUseCase,
  getSubmissionWithResultsUseCase: GetSubmissionWithResultsUseCase,
  resubmitSubmissionUseCase: ResubmitSubmissionUseCase,
  searchSubmissionsUseCase: SearchSubmissionsUseCase
): Router {
  const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    let userId = req.query.userId as string;
    if (req.user?.role === UserRole.STUDENT) {
      userId = req.user.sub;
    }
    
    const filters = {
      questionId: req.query.questionId as string,
      userId: userId,
      status: req.query.status as SubmissionStatus,
      verdict: req.query.verdict as string,
      page,
      limit
    };
    
    const result = await getAllSubmissionsUseCase.execute(filters);
    
    successResponse(res, result, 'List of submissions');
  })
);

/**
 * GET /api/submissions/search/global
 * Search submissions globally by multiple fields
 * Query params: q (search term), verdict (optional), status (optional), page, limit
 */
router.get(
  '/search/global',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const searchTerm = req.query.q as string;
    
    if (!searchTerm) {
      throw new ValidationError('Search term is required', 'SEARCH_TERM_REQUIRED');
    }
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const result = await searchSubmissionsUseCase.execute({
      searchTerm,
      verdict: req.query.verdict as string,
      status: req.query.status as SubmissionStatus,
      page,
      limit
    });
    
    successResponse(res, result, 'Search results');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const submission = await getSubmissionUseCase.execute(req.params.id);
    
    successResponse(res, submission, 'Submission found');
  })
);

router.post(
  '/',
  authenticate,
  validateBody(CreateSubmissionDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
    }
    
    const submission = await createSubmissionUseCase.execute({
      dto: req.body,
      userId: req.user.sub
    });
    
    successResponse(res, submission, 'Submission created successfully', 201);
  })
);

router.post(
  '/submit',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
    }
    
    const { questionId, code, language } = req.body;
    
    if (!questionId || !code || !language) {
      throw new ValidationError('Required fields: questionId, code, language', 'REQUIRED_FIELDS');
    }
    
    const result = await submissionService.submitCode({
      questionId,
      code,
      language,
      userId: req.user.sub
    });
    
    successResponse(res, result, 'Code submitted successfully', 201);
  })
);

router.get(
  '/:id/results',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const submissionDetail = await getSubmissionWithResultsUseCase.execute({
      submissionId: req.params.id,
      requestUserId: req.user?.role === UserRole.STUDENT ? req.user.sub : undefined
    });
    
    successResponse(res, submissionDetail, 'Submission results');
  })
);

/**
 * POST /api/submissions/:id/resubmit
 * Resubmit an existing submission (professors and assistants only)
 * Creates a new submission with the same code, language, and original user
 */
router.post(
  '/:id/resubmit',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
    }
    
    const newSubmission = await resubmitSubmissionUseCase.execute({
      submissionId: req.params.id,
      requestUserId: req.user.sub,
      requestUserRole: req.user.role
    });
    
    successResponse(res, newSubmission, 'Submission resubmitted successfully', 201);
  })
);

  return router;
}

export default createSubmissionController;

