import { Router, Response } from 'express';
import { SubmissionService } from '../services/SubmissionService';
import { CreateSubmissionDTO } from '../dtos';
import { validateBody, authenticate, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { SubmissionStatus } from '../enums';
import { UnauthorizedError, ValidationError } from '../utils';

function createSubmissionController(submissionService: SubmissionService): Router {
  const router = Router();

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const filters: any = {
        questionId: req.query.questionId as string,
        userId: req.query.userId as string,
        status: req.query.status as SubmissionStatus,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      };
      
      const submissions = await submissionService.getSubmissions(filters);
      
      successResponse(res, { submissions }, 'Lista de submissões');
    } catch (error) {
      throw error;
    }
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const submission = await submissionService.getSubmissionById(req.params.id);
      
      successResponse(res, submission, 'Submissão encontrada');
    } catch (error) {
      throw error;
    }
  }
);

router.post(
  '/',
  authenticate,
  validateBody(CreateSubmissionDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
      }
      
      const submission = await submissionService.createSubmission(
        req.body,
        req.user.sub
      );
      
      successResponse(res, submission, 'Submissão criada com sucesso', 201);
    } catch (error) {
      throw error;
    }
  }
);

router.post(
  '/submit',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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
    } catch (error) {
      throw error;
    }
  }
);

router.get(
  '/:id/results',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const submissionDetail = await submissionService.getSubmissionWithResults(req.params.id);
      
      successResponse(res, submissionDetail, 'Resultados da submissão');
    } catch (error) {
      throw error;
    }
  }
);

  return router;
}

export default createSubmissionController;

