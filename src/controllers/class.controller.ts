import { Router, Response } from 'express';
import { ClassService } from '../services/ClassService';
import { CreateClassDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils';

function createClassController(classService: ClassService): Router {
  const router = Router();

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const includeRelations = req.query.include === 'relations';
      const classes = await classService.getAllClasses(includeRelations);
      
      successResponse(res, classes, 'Lista de turmas');
    } catch (error) {
      throw error;
    }
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const includeRelations = req.query.include === 'relations';
      const classData = await classService.getClassById(req.params.id, includeRelations);
      
      successResponse(res, classData, 'Turma encontrada');
    } catch (error) {
      
      throw error;
    }
  }
);

router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateClassDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      logger.debug('[CREATE CLASS] Body recebido', { body: req.body, userId: req.user?.sub });
      
      const classData = await classService.createClass(
        req.body,
        req.user?.sub
      );
      
      logger.info('[CREATE CLASS] Turma criada com sucesso', { classId: classData.id });
      successResponse(res, classData, 'Turma criada com sucesso', 201);
    } catch (error) {
      logger.error('[CREATE CLASS] Erro', { error });
      
      throw error;
    }
  }
);

router.put(
  '/:id',
  authenticate,
  validateBody(CreateClassDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const classData = await classService.updateClass(
        req.params.id,
        req.body,
        req.user?.sub
      );
      
      successResponse(res, classData, 'Turma atualizada com sucesso');
    } catch (error) {
      
      throw error;
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await classService.deleteClass(req.params.id, req.user?.sub);
      
      successResponse(res, null, 'Turma deletada com sucesso');
    } catch (error) {
      
      throw error;
    }
  }
);

router.get(
  '/:id/students',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const students = await classService.getClassStudents(req.params.id);
      
      successResponse(res, { students }, 'Alunos da turma');
    } catch (error) {
      
      throw error;
    }
  }
);

router.post(
  '/:id/students',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { studentId } = req.body;
      
      if (!studentId) {
        errorResponse(res, 'ID do estudante é obrigatório', 'VALIDATION_ERROR', 400);
        return;
      }
      
      await classService.addStudentToClass(req.params.id, studentId);
      
      successResponse(res, null, 'Aluno adicionado à turma');
    } catch (error) {
      
      throw error;
    }
  }
);

router.delete(
  '/:id/students/:studentId',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await classService.removeStudentFromClass(
        req.params.id,
        req.params.studentId
      );
      
      successResponse(res, null, 'Aluno removido da turma');
    } catch (error) {
      
      throw error;
    }
  }
);

  return router;
}

export default createClassController;

