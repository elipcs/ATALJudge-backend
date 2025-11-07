/**
 * @module controllers/grade
 * @description REST API controller for grade endpoints
 * Manages grade retrieval and calculation for students and question lists
 * @class GradeController
 */
import { Router, Response } from 'express';
import { 
  GetGradeUseCase, 
  CalculateGradeUseCase, 
  GetStudentGradesUseCase, 
  GetListGradesUseCase,
  GetGradeByStudentAndListUseCase
} from '../use-cases/grade';
import { authenticate, AuthRequest, requireTeacher } from '../middlewares';
import { successResponse } from '../utils/responses';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../enums';

function createGradeController(
  _getGradeUseCase: GetGradeUseCase,
  calculateGradeUseCase: CalculateGradeUseCase,
  getStudentGradesUseCase: GetStudentGradesUseCase,
  getListGradesUseCase: GetListGradesUseCase,
  getGradeByStudentAndListUseCase: GetGradeByStudentAndListUseCase
): Router {
  const router = Router();

  // GET /api/grades/student/:studentId/questionList/:questionListId - Get student grade on a specific list
  router.get(
    '/student/:studentId/questionList/:questionListId',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const grade = await getGradeByStudentAndListUseCase.execute({
        studentId: req.params.studentId,
        questionListId: req.params.questionListId
      });
      
      successResponse(res, grade, 'Student grade in list');
    })
  );

  // POST /api/grades/calculate/student/:studentId/questionList/:questionListId - Calculate/recalculate grade
  router.post(
    '/calculate/student/:studentId/questionList/:questionListId',
    authenticate,
    requireTeacher,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const grade = await calculateGradeUseCase.execute({
        studentId: req.params.studentId,
        questionListId: req.params.questionListId
      });
      
      successResponse(res, grade, 'Grade calculated successfully');
    })
  );

  // GET /api/grades/student/:studentId - Get all grades for a student
  router.get(
    '/student/:studentId',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      // Student can only see their own grades
      if (req.user?.role === UserRole.STUDENT && req.user.sub !== req.params.studentId) {
        successResponse(res, { grades: [] }, 'No permission to view these grades');
        return;
      }

      const grades = await getStudentGradesUseCase.execute(req.params.studentId);
      
      successResponse(res, { grades }, 'Student grades');
    })
  );

  // GET /api/grades/questionList/:questionListId - Get all grades for a list
  router.get(
    '/questionList/:questionListId',
    authenticate,
    requireTeacher,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const grades = await getListGradesUseCase.execute(req.params.questionListId);
      
      successResponse(res, { grades }, 'List grades');
    })
  );

  return router;
}

export default createGradeController;
