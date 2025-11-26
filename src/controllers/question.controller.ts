/**
 * @module controllers/question
 * @description REST API controller for question endpoints
 * Manages question creation, retrieval, updates, and deletion
 * @class QuestionController
 */
import { Router, Response } from 'express';
import { CreateQuestionUseCase, UpdateQuestionUseCase, DeleteQuestionUseCase, GetQuestionByIdUseCase, GetAllQuestionsUseCase, GetQuestionsByAuthorUseCase, SearchQuestionsUseCase } from '../use-cases/question';
import { authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { convertQuestionPayload } from '../middlewares/payload-converter.middleware';
import { asyncHandler } from '../utils/asyncHandler';

function createQuestionController(
  createQuestionUseCase: CreateQuestionUseCase,
  updateQuestionUseCase: UpdateQuestionUseCase,
  deleteQuestionUseCase: DeleteQuestionUseCase,
  getQuestionByIdUseCase: GetQuestionByIdUseCase,
  getAllQuestionsUseCase: GetAllQuestionsUseCase,
  getQuestionsByAuthorUseCase: GetQuestionsByAuthorUseCase,
  searchQuestionsUseCase: SearchQuestionsUseCase
): Router {
  const router = Router();

  router.post(
    '/',
    authenticate,
    requireTeacher,
    convertQuestionPayload,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const question = await createQuestionUseCase.execute({
        dto: req.body});

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
    '/search/global',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const searchTerm = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!searchTerm || searchTerm.trim().length === 0) {
        successResponse(res, { questions: [], total: 0, page, limit }, 'No search term provided');
        return;
      }

      const result = await searchQuestionsUseCase.execute({
        searchTerm: searchTerm.trim(),
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

