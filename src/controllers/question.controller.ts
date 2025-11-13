/**
 * @module controllers/question
 * @description REST API controller for question endpoints
 * Manages question creation, retrieval, updates, and deletion
 * @class QuestionController
 */
import { Router, Response } from 'express';
import { CreateQuestionUseCase, UpdateQuestionUseCase, UpdateCodeforcesFieldsUseCase, DeleteQuestionUseCase, GetQuestionByIdUseCase, GetAllQuestionsUseCase } from '../use-cases/question';
import { authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { convertQuestionPayload } from '../middlewares/payload-converter.middleware';
import { asyncHandler } from '../utils/asyncHandler';

function createQuestionController(
  createQuestionUseCase: CreateQuestionUseCase,
  updateQuestionUseCase: UpdateQuestionUseCase,
  updateCodeforcesFieldsUseCase: UpdateCodeforcesFieldsUseCase,
  deleteQuestionUseCase: DeleteQuestionUseCase,
  getQuestionByIdUseCase: GetQuestionByIdUseCase,
  getAllQuestionsUseCase: GetAllQuestionsUseCase
): Router {
  const router = Router();

router.post(
  '/',
  authenticate,
  requireTeacher,
  convertQuestionPayload,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const question = await createQuestionUseCase.execute({
      dto: req.body,
      authorId: req.user!.sub
    });
    
    successResponse(res, question, 'Question created successfully', 201);
  })
);

router.get(
  '/',
  authenticate,
  asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    const questions = await getAllQuestionsUseCase.execute();
    
    successResponse(res, { questions }, 'List of questions');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const question = await getQuestionByIdUseCase.execute(req.params.id);
    
    successResponse(res, question, 'Question data');
  })
);

router.put(
  '/:id',
  authenticate,
  requireTeacher,
  convertQuestionPayload,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const question = await updateQuestionUseCase.execute({
      questionId: req.params.id,
      dto: req.body,
      userId: req.user!.sub,
      userRole: req.user!.role
    });
    
    successResponse(res, question, 'Question updated successfully');
  })
);

/**
 * PUT /api/questions/:id/codeforces
 * Update Codeforces-specific fields (separate from main question update)
 * Body: { contestId?, problemIndex? }
 */
router.put(
  '/:id/codeforces',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const question = await updateCodeforcesFieldsUseCase.execute({
      questionId: req.params.id,
      dto: req.body,
      userId: req.user!.sub,
      userRole: req.user!.role
    });
    
    successResponse(res, question, 'Codeforces fields updated successfully');
  })
);

router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await deleteQuestionUseCase.execute({
      questionId: req.params.id,
      userId: req.user!.sub
    });
    
    successResponse(res, null, 'Question deleted successfully');
  })
);

  return router;
}

export default createQuestionController;

