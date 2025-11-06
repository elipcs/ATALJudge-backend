import { Router, Response } from 'express';
import { SubmissionService } from '../services/SubmissionService';
import { CreateSubmissionDTO } from '../dtos';
import { validateBody, authenticate, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { SubmissionStatus, UserRole } from '../enums';
import { UnauthorizedError, ValidationError } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createSubmissionController(submissionService: SubmissionService): Router {
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
    
    const filters: any = {
      questionId: req.query.questionId as string,
      userId: userId,
      status: req.query.status as SubmissionStatus,
      verdict: req.query.verdict as string,
      page,
      limit
    };
    
    const result = await submissionService.getSubmissions(filters);
    
    successResponse(res, result, 'Lista de submissões');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const submission = await submissionService.getSubmissionById(
      req.params.id,
      req.user?.role === UserRole.STUDENT ? req.user.sub : undefined
    );
    
    successResponse(res, submission, 'Submissão encontrada');
  })
);

router.post(
  '/',
  authenticate,
  validateBody(CreateSubmissionDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
    }
    
    const submission = await submissionService.createSubmission(
      req.body,
      req.user.sub
    );
    
    successResponse(res, submission, 'Submissão criada com sucesso', 201);
  })
);

router.post(
  '/submit',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
    }
    
    const { questionId, code, language } = req.body;
    
    if (!questionId || !code || !language) {
      throw new ValidationError('Campos obrigatórios: questionId, code, language', 'REQUIRED_FIELDS');
    }
    
    const result = await submissionService.submitCode({
      questionId,
      code,
      language,
      userId: req.user.sub
    });
    
    successResponse(res, result, 'Código submetido com sucesso', 201);
  })
);

router.get(
  '/:id/results',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const submissionDetail = await submissionService.getSubmissionWithResults(
      req.params.id,
      req.user?.role === UserRole.STUDENT ? req.user.sub : undefined
    );
    
    successResponse(res, submissionDetail, 'Resultados da submissão');
  })
);

  return router;
}

export default createSubmissionController;

