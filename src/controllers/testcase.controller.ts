import { Router, Response } from 'express';
import { TestCaseService } from '../services/TestCaseService';
import { CreateTestCaseDTO, UpdateTestCaseDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';

function createTestCaseController(testCaseService: TestCaseService): Router {
  const router = Router();

/**
 * GET /api/questions/:questionId/testcases
 * Lista casos de teste de uma questão
 */
router.get(
  '/questions/:questionId/testcases',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const testCases = await testCaseService.getTestCasesByQuestion(req.params.questionId);
      
      successResponse(res, testCases, 'Casos de teste');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/questions/:questionId/testcases
 * Cria um novo caso de teste (apenas professores/assistentes)
 */
router.post(
  '/questions/:questionId/testcases',
  authenticate,
  requireTeacher,
  validateBody(CreateTestCaseDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Adicionar questionId do parâmetro da URL ao body
      const data = {
        ...req.body,
        questionId: req.params.questionId
      };
      
      const testCase = await testCaseService.createTestCase(data);
      
      successResponse(res, testCase, 'Caso de teste criado com sucesso', 201);
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/testcases/:id
 * Busca caso de teste por ID
 */
router.get(
  '/testcases/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const testCase = await testCaseService.getTestCaseById(req.params.id);
      
      successResponse(res, testCase, 'Caso de teste');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * PUT /api/testcases/:id
 * Atualiza um caso de teste (apenas professores/assistentes)
 */
router.put(
  '/testcases/:id',
  authenticate,
  requireTeacher,
  validateBody(UpdateTestCaseDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const testCase = await testCaseService.updateTestCase(req.params.id, req.body);
      
      successResponse(res, testCase, 'Caso de teste atualizado com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * DELETE /api/testcases/:id
 * Deleta um caso de teste (apenas professores/assistentes)
 */
router.delete(
  '/testcases/:id',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await testCaseService.deleteTestCase(req.params.id);
      
      successResponse(res, null, 'Caso de teste deletado com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

  return router;
}

export default createTestCaseController;


