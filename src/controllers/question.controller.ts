import { Router, Response } from 'express';
import { QuestionService } from '../services';
import { authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { convertQuestionPayload } from '../middlewares/payload-converter.middleware';
import { asyncHandler } from '../utils/asyncHandler';

function createQuestionController(questionService: QuestionService): Router {
  const router = Router();

router.post(
  '/',
  authenticate,
  requireTeacher,
  convertQuestionPayload,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const question = await questionService.createQuestion(
      req.body,
      req.user?.sub
    );
    
    successResponse(res, question, 'Questão criada com sucesso', 201);
  })
);

router.get(
  '/',
  authenticate,
  asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    const questions = await questionService.getAllQuestions();
    
    successResponse(res, { questions }, 'Lista de questões');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const question = await questionService.getQuestionById(req.params.id);
    
    successResponse(res, question, 'Dados da questão');
  })
);

router.put(
  '/:id',
  authenticate,
  requireTeacher,
  convertQuestionPayload,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const question = await questionService.updateQuestion(
      req.params.id,
      req.body
    );
    
    successResponse(res, question, 'Questão atualizada com sucesso');
  })
);

router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await questionService.deleteQuestion(req.params.id);
    
    successResponse(res, null, 'Questão deletada com sucesso');
  })
);

  return router;
}

export default createQuestionController;

