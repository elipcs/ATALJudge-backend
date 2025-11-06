import { Router, Response } from 'express';
import { QuestionListService } from '../services/QuestionListService';
import { CreateQuestionListDTO, UpdateQuestionListDTO, UpdateQuestionListScoringDTO } from '../dtos/QuestionListDtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { ValidationError, logger } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createQuestionListController(listService: QuestionListService): Router {
  const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const filters = {
      search: req.query.search as string,
      classId: req.query.classId as string,
      status: req.query.status as 'draft' | 'published' | undefined
    };
    
    const lists = await listService.getAllLists(filters);
    
    successResponse(res, { lists, count: lists.length }, 'Listas de questões');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const list = await listService.getListById(req.params.id);
    
    successResponse(res, list, 'Lista encontrada');
  })
);

router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateQuestionListDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const data = {
      title: req.body.title,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      classIds: req.body.classIds,
      isRestricted: req.body.isRestricted || false
    };
    
const list = await listService.createList(data, req.user?.sub);
    
    successResponse(res, list, 'Lista criada com sucesso', 201);
  })
);

router.put(
  '/:id',
  authenticate,
  requireTeacher,
  (req: AuthRequest, _res: Response, next) => {
    logger.debug('[QUESTION_LIST PUT] Body recebido do frontend', {
      listId: req.params.id,
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers['content-type'],
      rawBody: JSON.stringify(req.body),
      title: req.body?.title,
      description: req.body?.description,
      startDate: req.body?.startDate,
      endDate: req.body?.endDate,
      classIds: req.body?.classIds,
      scoringMode: req.body?.scoringMode,
      maxScore: req.body?.maxScore,
      minQuestionsForMaxScore: req.body?.minQuestionsForMaxScore,
      questionGroups: req.body?.questionGroups,
      isRestricted: req.body?.isRestricted,
      userId: req.user?.sub
    });
    next();
  },
  validateBody(UpdateQuestionListDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[QUESTION_LIST PUT] Validação passou, processando atualização', {
      listId: req.params.id,
      userId: req.user?.sub
    });

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
    
    logger.debug('[QUESTION_LIST PUT] Dados transformados para service', {
      listId: req.params.id,
      data
    });
    
    const list = await listService.updateList(req.params.id, data);
    
    logger.info('[QUESTION_LIST PUT] Lista atualizada com sucesso', {
      listId: req.params.id,
      updatedList: list
    });

    successResponse(res, list, 'Lista atualizada com sucesso');
  })
);

router.patch(
  '/:id/scoring',
  authenticate,
  requireTeacher,
  validateBody(UpdateQuestionListScoringDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[QUESTION_LIST PATCH SCORING] Atualização de pontuação recebida', {
      listId: req.params.id,
      scoringMode: req.body.scoringMode,
      maxScore: req.body.maxScore,
      minQuestionsForMaxScore: req.body.minQuestionsForMaxScore,
      userId: req.user?.sub
    });

    const data = {
      scoringMode: req.body.scoringMode,
      maxScore: req.body.maxScore,
      minQuestionsForMaxScore: req.body.minQuestionsForMaxScore,
      questionGroups: req.body.questionGroups || []
    };
    
    const list = await listService.updateListScoring(req.params.id, data);
    
    logger.info('[QUESTION_LIST PATCH SCORING] Pontuação atualizada com sucesso', {
      listId: req.params.id,
      scoringMode: list.scoringMode,
      maxScore: list.maxScore
    });

    successResponse(res, list, 'Configuração de pontuação atualizada com sucesso');
  })
);

router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await listService.deleteList(req.params.id);
    
    successResponse(res, null, 'Lista deletada com sucesso');
  })
);

router.post(
  '/:id/publish',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const list = await listService.publishList(req.params.id);
    
    successResponse(res, list, 'Lista publicada com sucesso');
  })
);

router.post(
  '/:id/unpublish',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const list = await listService.unpublishList(req.params.id);
    
    successResponse(res, list, 'Lista despublicada com sucesso');
  })
);

router.post(
  '/:id/questions',
  authenticate,
  requireTeacher,
  (req: AuthRequest, _res: Response, next) => {
    logger.debug('[QUESTION_LIST ADD QUESTION] Request recebido', {
      listId: req.params.id,
      bodyKeys: Object.keys(req.body || {}),
      questionId: req.body?.questionId,
      fullBody: JSON.stringify(req.body),
      userId: req.user?.sub
    });
    next();
  },
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const questionId = req.body.questionId;
    
    logger.debug('[QUESTION_LIST ADD QUESTION] Validando questionId', {
      listId: req.params.id,
      questionId,
      hasQuestionId: !!questionId
    });

    if (!questionId) {
      logger.warn('[QUESTION_LIST ADD QUESTION] questionId não fornecido', {
        listId: req.params.id,
        body: req.body
      });
      throw new ValidationError('ID da questão é obrigatório', 'QUESTION_ID_REQUIRED');
    }
    
    logger.debug('[QUESTION_LIST ADD QUESTION] Chamando service.addQuestionToList', {
      listId: req.params.id,
      questionId,
      userId: req.user?.sub
    });

    await listService.addQuestionToList(req.params.id, questionId);
    
    logger.info('[QUESTION_LIST ADD QUESTION] Questão adicionada com sucesso', {
      listId: req.params.id,
      questionId,
      userId: req.user?.sub
    });

    successResponse(res, null, 'Questão adicionada à lista');
  })
);

router.delete(
  '/:id/questions/:questionId',
  authenticate,
  requireTeacher,
  (req: AuthRequest, _res: Response, next) => {
    logger.debug('[QUESTION_LIST REMOVE QUESTION] Request recebido', {
      listId: req.params.id,
      questionId: req.params.questionId,
      userId: req.user?.sub
    });
    next();
  },
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[QUESTION_LIST REMOVE QUESTION] Chamando service.removeQuestionFromList', {
      listId: req.params.id,
      questionId: req.params.questionId,
      userId: req.user?.sub
    });

    await listService.removeQuestionFromList(req.params.id, req.params.questionId);
    
    logger.info('[QUESTION_LIST REMOVE QUESTION] Questão removida com sucesso', {
      listId: req.params.id,
      questionId: req.params.questionId,
      userId: req.user?.sub
    });

    successResponse(res, null, 'Questão removida da lista');
  })
);

  return router;
}

export default createQuestionListController;

