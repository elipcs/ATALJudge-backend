import { Router, Response } from 'express';
import { ClassService } from '../services/ClassService';
import { CreateClassDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createClassController(classService: ClassService): Router {
  const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const includeRelations = req.query.include === 'relations';
    const classes = await classService.getAllClasses(includeRelations);
    
    successResponse(res, classes, 'Lista de turmas');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const includeRelations = req.query.include === 'relations';
    const classData = await classService.getClassById(req.params.id, includeRelations);
    
    successResponse(res, classData, 'Turma encontrada');
  })
);

router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateClassDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[CREATE CLASS] Body recebido', { body: req.body, userId: req.user?.sub });
    
    const classData = await classService.createClass(
      req.body,
      req.user?.sub
    );
    
    logger.info('[CREATE CLASS] Turma criada com sucesso', { classId: classData.id });
    successResponse(res, classData, 'Turma criada com sucesso', 201);
  })
);

router.put(
  '/:id',
  authenticate,
  validateBody(CreateClassDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const classData = await classService.updateClass(
      req.params.id,
      req.body,
      req.user?.sub
    );
    
    successResponse(res, classData, 'Turma atualizada com sucesso');
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await classService.deleteClass(req.params.id, req.user?.sub);
    
    successResponse(res, null, 'Turma deletada com sucesso');
  })
);

router.get(
  '/:id/students',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const students = await classService.getClassStudents(req.params.id);
    
    successResponse(res, { students }, 'Alunos da turma');
  })
);

router.post(
  '/:id/students',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { studentId } = req.body;
    
    if (!studentId) {
      errorResponse(res, 'ID do estudante é obrigatório', 'VALIDATION_ERROR', 400);
      return;
    }
    
    await classService.addStudentToClass(req.params.id, studentId);
    
    successResponse(res, null, 'Aluno adicionado à turma');
  })
);

router.delete(
  '/:id/students/:studentId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await classService.removeStudentFromClass(
      req.params.id,
      req.params.studentId
    );
    
    successResponse(res, null, 'Aluno removido da turma');
  })
);

  return router;
}

export default createClassController;

