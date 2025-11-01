import { Router, Response } from 'express';
import { GradeService } from '../services/GradeService';
import { CreateGradeDTO, UpdateGradeDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, requireOwnResourceOrTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';

function createGradeController(gradeService: GradeService): Router {
  const router = Router();

/**
 * GET /api/grades/:id
 * Busca nota por ID (apenas professores/assistentes)
 */
router.get(
  '/:id',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const grade = await gradeService.getGradeById(req.params.id);
      
      successResponse(res, grade, 'Nota encontrada');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/grades/student/:studentId
 * Busca todas as notas de um estudante
 */
router.get(
  '/student/:studentId',
  authenticate,
  requireOwnResourceOrTeacher('studentId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const grades = await gradeService.getGradesByStudent(req.params.studentId);
      
      successResponse(res, grades, 'Notas do estudante');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/grades/list/:listId
 * Busca todas as notas de uma lista (apenas professores/assistentes)
 */
router.get(
  '/list/:listId',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const grades = await gradeService.getGradesByList(req.params.listId);
      
      successResponse(res, grades, 'Notas da lista');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/grades/student/:studentId/list/:listId
 * Busca nota de um estudante em uma lista específica
 */
router.get(
  '/student/:studentId/list/:listId',
  authenticate,
  requireOwnResourceOrTeacher('studentId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const grade = await gradeService.getGradeByStudentAndList(
        req.params.studentId,
        req.params.listId
      );
      
      if (!grade) {
        successResponse(res, null, 'Nota não encontrada', 404);
        return;
      }

      successResponse(res, grade, 'Nota encontrada');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/grades
 * Cria ou atualiza uma nota (apenas professores/assistentes)
 */
router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateGradeDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const grade = await gradeService.upsertGrade(req.body);
      
      successResponse(res, grade, 'Nota salva com sucesso', 201);
    } catch (error) {
      throw error;
    }
  }
);

/**
 * PUT /api/grades/:id
 * Atualiza uma nota (apenas professores/assistentes)
 */
router.put(
  '/:id',
  authenticate,
  requireTeacher,
  validateBody(UpdateGradeDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const grade = await gradeService.updateGrade(req.params.id, req.body);
      
      successResponse(res, grade, 'Nota atualizada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * DELETE /api/grades/:id
 * Deleta uma nota (apenas professores/assistentes)
 */
router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await gradeService.deleteGrade(req.params.id);
      
      successResponse(res, null, 'Nota deletada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

  return router;
}

export default createGradeController;

