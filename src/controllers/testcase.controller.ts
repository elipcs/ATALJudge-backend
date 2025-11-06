import { Router, Response } from 'express';
import { TestCaseService } from '../services/TestCaseService';
import { CreateTestCaseDTO, UpdateTestCaseDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { asyncHandler } from '../utils/asyncHandler';

function createTestCaseController(testCaseService: TestCaseService): Router {
  const router = Router();

router.get(
  '/questions/:questionId/testcases',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testCases = await testCaseService.getTestCasesByQuestion(req.params.questionId);
    
    successResponse(res, testCases, 'Casos de teste');
  })
);

router.post(
  '/questions/:questionId/testcases',
  authenticate,
  requireTeacher,
  validateBody(CreateTestCaseDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const data = {
      ...req.body,
      questionId: req.params.questionId
    };
    
    const testCase = await testCaseService.createTestCase(data);
    
    successResponse(res, testCase, 'Caso de teste criado com sucesso', 201);
  })
);

router.get(
  '/testcases/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testCase = await testCaseService.getTestCaseById(req.params.id);
    
    successResponse(res, testCase, 'Caso de teste');
  })
);

router.put(
  '/testcases/:id',
  authenticate,
  requireTeacher,
  validateBody(UpdateTestCaseDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testCase = await testCaseService.updateTestCase(req.params.id, req.body);
    
    successResponse(res, testCase, 'Caso de teste atualizado com sucesso');
  })
);

router.delete(
  '/testcases/:id',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await testCaseService.deleteTestCase(req.params.id);
    
    successResponse(res, null, 'Caso de teste deletado com sucesso');
  })
);

  return router;
}

export default createTestCaseController;

