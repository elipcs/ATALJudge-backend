import { Router, Response } from 'express';
import { 
  CreateQuestionListUseCase, 
  GetQuestionListUseCase, 
  UpdateQuestionListUseCase, 
  DeleteQuestionListUseCase,
  GetAllQuestionListsUseCase,
  UpdateListScoringUseCase,
  AddQuestionToListUseCase,
  RemoveQuestionFromListUseCase
} from '../use-cases/question-list';
import { CreateQuestionListDTO, UpdateQuestionListDTO, UpdateQuestionListScoringDTO } from '../dtos/QuestionListDtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { ValidationError, logger } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createQuestionListController(
  createQuestionListUseCase: CreateQuestionListUseCase,
  getQuestionListUseCase: GetQuestionListUseCase,
  updateQuestionListUseCase: UpdateQuestionListUseCase,
  deleteQuestionListUseCase: DeleteQuestionListUseCase,
  getAllQuestionListsUseCase: GetAllQuestionListsUseCase,
  updateListScoringUseCase: UpdateListScoringUseCase,
  addQuestionToListUseCase: AddQuestionToListUseCase,
  removeQuestionFromListUseCase: RemoveQuestionFromListUseCase
): Router {
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
    
    const lists = await getAllQuestionListsUseCase.execute(filters);
    
    successResponse(res, { lists, count: lists.length }, 'Listas de questões');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const list = await getQuestionListUseCase.execute(req.params.id);
    
    successResponse(res, list, 'Lista encontrada');
  })
);

router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateQuestionListDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const list = await createQuestionListUseCase.execute({
      dto: req.body,
      authorId: req.user!.sub
    });
    
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

    const list = await updateQuestionListUseCase.execute({
      listId: req.params.id,
      dto: req.body,
      userId: req.user!.sub
    });
    
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
    
    const list = await updateListScoringUseCase.execute({
      listId: req.params.id,
      data
    });
    
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
    await deleteQuestionListUseCase.execute({
      listId: req.params.id,
      userId: req.user!.sub
    });
    
    successResponse(res, null, 'Lista deletada com sucesso');
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
    
    logger.debug('[QUESTION_LIST ADD QUESTION] Chamando addQuestionToListUseCase', {
      listId: req.params.id,
      questionId,
      userId: req.user?.sub
    });

    await addQuestionToListUseCase.execute({
      listId: req.params.id,
      questionId
    });
    
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
    logger.debug('[QUESTION_LIST REMOVE QUESTION] Chamando removeQuestionFromListUseCase', {
      listId: req.params.id,
      questionId: req.params.questionId,
      userId: req.user?.sub
    });

    await removeQuestionFromListUseCase.execute({
      listId: req.params.id,
      questionId: req.params.questionId
    });
    
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

