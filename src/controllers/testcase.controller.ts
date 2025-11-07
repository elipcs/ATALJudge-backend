import { Router, Response } from 'express';
import { CreateTestCaseDTO, UpdateTestCaseDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { asyncHandler } from '../utils/asyncHandler';
import {
  CreateTestCaseUseCase,
  GetTestCasesByQuestionUseCase,
  GetTestCaseByIdUseCase,
  UpdateTestCaseUseCase,
  DeleteTestCaseUseCase
} from '../use-cases/testcase';

function createTestCaseController(
  createTestCaseUseCase: CreateTestCaseUseCase,
  getTestCasesByQuestionUseCase: GetTestCasesByQuestionUseCase,
  getTestCaseByIdUseCase: GetTestCaseByIdUseCase,
  updateTestCaseUseCase: UpdateTestCaseUseCase,
  deleteTestCaseUseCase: DeleteTestCaseUseCase
): Router {
  const router = Router();

router.get(
  '/questions/:questionId/testcases',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testCases = await getTestCasesByQuestionUseCase.execute(req.params.questionId);
    
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
    
    const testCase = await createTestCaseUseCase.execute(data);
    
    successResponse(res, testCase, 'Caso de teste criado com sucesso', 201);
  })
);

router.get(
  '/testcases/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testCase = await getTestCaseByIdUseCase.execute(req.params.id);
    
    successResponse(res, testCase, 'Caso de teste');
  })
);

router.put(
  '/testcases/:id',
  authenticate,
  requireTeacher,
  validateBody(UpdateTestCaseDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testCase = await updateTestCaseUseCase.execute({
      id: req.params.id,
      data: req.body
    });
    
    successResponse(res, testCase, 'Caso de teste atualizado com sucesso');
  })
);

router.delete(
  '/testcases/:id',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await deleteTestCaseUseCase.execute(req.params.id);
    
    successResponse(res, null, 'Caso de teste deletado com sucesso');
  })
);

  return router;
}

export default createTestCaseController;

