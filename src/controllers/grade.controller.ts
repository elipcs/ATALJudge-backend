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

  // GET /api/grades/student/:studentId/list/:listId - Obter nota de um aluno em uma lista específica
  router.get(
    '/student/:studentId/list/:listId',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const grade = await getGradeByStudentAndListUseCase.execute({
        studentId: req.params.studentId,
        listId: req.params.listId
      });
      
      successResponse(res, grade, 'Nota do aluno na lista');
    })
  );

  // POST /api/grades/calculate/student/:studentId/list/:listId - Calcular/recalcular nota
  router.post(
    '/calculate/student/:studentId/list/:listId',
    authenticate,
    requireTeacher,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const grade = await calculateGradeUseCase.execute({
        studentId: req.params.studentId,
        listId: req.params.listId
      });
      
      successResponse(res, grade, 'Nota calculada com sucesso');
    })
  );

  // GET /api/grades/student/:studentId - Obter todas as notas de um aluno
  router.get(
    '/student/:studentId',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      // Estudante só pode ver suas próprias notas
      if (req.user?.role === UserRole.STUDENT && req.user.sub !== req.params.studentId) {
        successResponse(res, { grades: [] }, 'Sem permissão para visualizar essas notas');
        return;
      }

      const grades = await getStudentGradesUseCase.execute(req.params.studentId);
      
      successResponse(res, { grades }, 'Notas do aluno');
    })
  );

  // GET /api/grades/list/:listId - Obter todas as notas de uma lista
  router.get(
    '/list/:listId',
    authenticate,
    requireTeacher,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const grades = await getListGradesUseCase.execute(req.params.listId);
      
      successResponse(res, { grades }, 'Notas da lista');
    })
  );

  return router;
}

export default createGradeController;
