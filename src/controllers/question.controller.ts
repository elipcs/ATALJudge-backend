import { Router, Response } from 'express';
import { QuestionService } from '../services';
import { authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { convertQuestionPayload } from '../middlewares/payload-converter.middleware';

function createQuestionController(questionService: QuestionService): Router {
  const router = Router();

/**
 * POST /api/questions
 * Cria uma nova questão (local ou codeforces)
 * O tipo é detectado automaticamente baseado nos campos
 */
router.post(
  '/',
  authenticate,
  requireTeacher,
  convertQuestionPayload,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const question = await questionService.createQuestion(
        req.body,
        req.user?.userId
      );
      
      successResponse(res, question, 'Questão criada com sucesso', 201);
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/questions
 * Lista todas as questões
 */
router.get(
  '/',
  authenticate,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const questions = await questionService.getAllQuestions();
      
      successResponse(res, { questions }, 'Lista de questões');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/questions/:id
 * Busca questão por ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const question = await questionService.getQuestionById(req.params.id);
      
      successResponse(res, question, 'Dados da questão');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * PUT /api/questions/:id
 * Atualiza uma questão (apenas professores/assistentes)
 */
router.put(
  '/:id',
  authenticate,
  requireTeacher,
  convertQuestionPayload,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const question = await questionService.updateQuestion(
        req.params.id,
        req.body
      );
      
      successResponse(res, question, 'Questão atualizada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * DELETE /api/questions/:id
 * Deleta uma questão (apenas professores/assistentes)
 */
router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await questionService.deleteQuestion(req.params.id);
      
      successResponse(res, null, 'Questão deletada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

  return router;
}

export default createQuestionController;

