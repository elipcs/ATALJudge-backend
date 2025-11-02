import { Router, Response } from 'express';
import { TestCaseService } from '../services/TestCaseService';
import { CreateTestCaseDTO, UpdateTestCaseDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';

function createTestCaseController(testCaseService: TestCaseService): Router {
  const router = Router();

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

router.post(
  '/questions/:questionId/testcases',
  authenticate,
  requireTeacher,
  validateBody(CreateTestCaseDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      
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

