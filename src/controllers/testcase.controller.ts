/**
 * @module controllers/testcase
 * @description REST API controller for test case endpoints
 * Manages test case creation, retrieval, updates, and deletion
 * @class TestCaseController
 */
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

/**
 * Test Case Controller
 * 
 * Handles test case management endpoints.
 * Provides operations for creating, retrieving, updating, and deleting test cases.
 * 
 * @module controllers/testcase
 */

/**
 * Create Test Case Controller
 * 
 * Factory function that creates and configures the test case routes router.
 * 
 * @param {CreateTestCaseUseCase} createTestCaseUseCase - Use case for creating test cases
 * @param {GetTestCasesByQuestionUseCase} getTestCasesByQuestionUseCase - Use case for fetching test cases by question
 * @param {GetTestCaseByIdUseCase} getTestCaseByIdUseCase - Use case for fetching a single test case
 * @param {UpdateTestCaseUseCase} updateTestCaseUseCase - Use case for updating test cases
 * @param {DeleteTestCaseUseCase} deleteTestCaseUseCase - Use case for deleting test cases
 * @returns {Router} Express router with test case endpoints
 * 
 * Routes:
 * - GET /questions/:questionId/testcases - List test cases for a question (requires authentication)
 * - POST /questions/:questionId/testcases - Create test case (requires teacher role)
 * - GET /testcases/:id - Get specific test case (requires authentication)
 * - PUT /testcases/:id - Update test case (requires teacher role)
 * - DELETE /testcases/:id - Delete test case (requires teacher role)
 */
function createTestCaseController(
  createTestCaseUseCase: CreateTestCaseUseCase,
  getTestCasesByQuestionUseCase: GetTestCasesByQuestionUseCase,
  getTestCaseByIdUseCase: GetTestCaseByIdUseCase,
  updateTestCaseUseCase: UpdateTestCaseUseCase,
  deleteTestCaseUseCase: DeleteTestCaseUseCase
): Router {
  const router = Router();

/**
 * GET /questions/:questionId/testcases
 * List all test cases for a question
 */
router.get(
  '/questions/:questionId/testcases',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testCases = await getTestCasesByQuestionUseCase.execute(req.params.questionId);
    
    successResponse(res, testCases, 'Test cases');
  })
);

/**
 * POST /questions/:questionId/testcases
 * Create a new test case for a question
 */
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
    
    successResponse(res, testCase, 'Test case created successfully', 201);
  })
);

/**
 * GET /testcases/:id
 * Get a specific test case by ID
 */
router.get(
  '/testcases/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testCase = await getTestCaseByIdUseCase.execute(req.params.id);
    
    successResponse(res, testCase, 'Test case');
  })
);

/**
 * PUT /testcases/:id
 * Update an existing test case
 */
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
    
    successResponse(res, testCase, 'Test case updated successfully');
  })
);

/**
 * DELETE /testcases/:id
 * Delete a test case
 */
router.delete(
  '/testcases/:id',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await deleteTestCaseUseCase.execute(req.params.id);
    
    successResponse(res, null, 'Test case deleted successfully');
  })
);

  return router;
}

export default createTestCaseController;

