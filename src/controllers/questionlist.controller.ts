import { Router, Response } from 'express';
import { QuestionListService } from '../services/QuestionListService';
import { CreateQuestionListDTO, UpdateQuestionListDTO } from '../dtos/QuestionListDtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { ValidationError } from '../utils';

function createQuestionListController(listService: QuestionListService): Router {
  const router = Router();

/**
 * GET /api/lists
 * Lista todas as listas com filtros
 */
router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const filters = {
        search: req.query.search as string,
        classId: req.query.classId as string,
        status: req.query.status as 'draft' | 'published' | undefined
      };
      
      const lists = await listService.getAllLists(filters);
      
      successResponse(res, { lists, count: lists.length }, 'Listas de questões');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/lists/:id
 * Busca lista por ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const list = await listService.getListById(req.params.id);
      
      successResponse(res, list, 'Lista encontrada');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/lists
 * Cria uma nova lista (apenas professores/assistentes)
 */
router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateQuestionListDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = {
        title: req.body.title,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        classIds: req.body.classIds,
        scoringMode: req.body.scoringMode || 'simple',
        maxScore: req.body.maxScore || 10,
        minQuestionsForMaxScore: req.body.minQuestionsForMaxScore || undefined,
        questionGroups: req.body.questionGroups || [],
        isRestricted: req.body.isRestricted || false
      };
      
      const list = await listService.createList(data, req.user?.userId);
      
      successResponse(res, list, 'Lista criada com sucesso', 201);
    } catch (error) {
      throw error;
    }
  }
);

/**
 * PUT /api/lists/:id
 * Atualiza uma lista (apenas professores/assistentes)
 */
router.put(
  '/:id',
  authenticate,
  requireTeacher,
  validateBody(UpdateQuestionListDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = {
        title: req.body.title,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        classIds: req.body.classIds,
        scoringMode: req.body.scoringMode || 'simple',
        maxScore: req.body.maxScore || 10,
        minQuestionsForMaxScore: req.body.minQuestionsForMaxScore || undefined,
        questionGroups: req.body.questionGroups || [],
        isRestricted: req.body.isRestricted || false
      };
      
      const list = await listService.updateList(req.params.id, data);
      
      successResponse(res, list, 'Lista atualizada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * DELETE /api/lists/:id
 * Deleta uma lista (apenas professores/assistentes)
 */
router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await listService.deleteList(req.params.id);
      
      successResponse(res, null, 'Lista deletada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/lists/:id/publish
 * Publica uma lista
 */
router.post(
  '/:id/publish',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const list = await listService.publishList(req.params.id);
      
      successResponse(res, list, 'Lista publicada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/lists/:id/unpublish
 * Despublica uma lista
 */
router.post(
  '/:id/unpublish',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const list = await listService.unpublishList(req.params.id);
      
      successResponse(res, list, 'Lista despublicada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/lists/:id/questions
 * Adiciona questão à lista
 */
router.post(
  '/:id/questions',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const questionId = req.body.questionId;
      
      if (!questionId) {
        throw new ValidationError('ID da questão é obrigatório', 'QUESTION_ID_REQUIRED');
      }
      
      await listService.addQuestionToList(req.params.id, questionId);
      
      successResponse(res, null, 'Questão adicionada à lista');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * DELETE /api/lists/:id/questions/:questionId
 * Remove questão da lista
 */
router.delete(
  '/:id/questions/:questionId',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await listService.removeQuestionFromList(req.params.id, req.params.questionId);
      
      successResponse(res, null, 'Questão removida da lista');
    } catch (error) {
      throw error;
    }
  }
);

  return router;
}

export default createQuestionListController;


