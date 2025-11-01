import { Router, Response } from 'express';
import { ClassService } from '../services/ClassService';
import { CreateClassDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils';

function createClassController(classService: ClassService): Router {
  const router = Router();

/**
 * GET /api/classes
 * Lista todas as turmas
 */
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

/**
 * GET /api/classes/:id
 * Busca turma por ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const includeRelations = req.query.include === 'relations';
      const classData = await classService.getClassById(req.params.id, includeRelations);
      
      successResponse(res, classData, 'Turma encontrada');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * POST /api/classes
 * Cria uma nova turma (apenas professores)
 */
router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateClassDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      logger.debug('[CREATE CLASS] Body recebido', { body: req.body, userId: req.user?.userId });
      
      const classData = await classService.createClass(
        req.body,
        req.user?.userId
      );
      
      logger.info('[CREATE CLASS] Turma criada com sucesso', { classId: classData.id });
      successResponse(res, classData, 'Turma criada com sucesso', 201);
    } catch (error) {
      logger.error('[CREATE CLASS] Erro', { error });
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * PUT /api/classes/:id
 * Atualiza uma turma
 */
router.put(
  '/:id',
  authenticate,
  validateBody(CreateClassDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const classData = await classService.updateClass(
        req.params.id,
        req.body,
        req.user?.userId
      );
      
      successResponse(res, classData, 'Turma atualizada com sucesso');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * DELETE /api/classes/:id
 * Deleta uma turma
 */
router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await classService.deleteClass(req.params.id, req.user?.userId);
      
      successResponse(res, null, 'Turma deletada com sucesso');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * GET /api/classes/:id/students
 * Lista alunos de uma turma
 */
router.get(
  '/:id/students',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const students = await classService.getClassStudents(req.params.id);
      
      successResponse(res, { students }, 'Alunos da turma');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * POST /api/classes/:id/students
 * Adiciona aluno à turma
 */
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
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * DELETE /api/classes/:id/students/:studentId
 * Remove aluno da turma
 */
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
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

  return router;
}

export default createClassController;


