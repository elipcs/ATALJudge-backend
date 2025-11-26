/**
 * @module controllers/questionlist
 * @description REST API controller for question list endpoints
 * Manages question list creation, retrieval, updates, and question assignments
 * @class QuestionListController
 */
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
    
    const questionLists = await getAllQuestionListsUseCase.execute(filters);
    
    successResponse(res, { questionLists, count: questionLists.length }, 'Question lists');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const questionList = await getQuestionListUseCase.execute(req.params.id);
    
    successResponse(res, questionList, 'Question list found');
  })
);

router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateQuestionListDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const questionList = await createQuestionListUseCase.execute({
      dto: req.body});
    
    successResponse(res, questionList, 'Question list created successfully', 201);
  })
);

router.put(
  '/:id',
  authenticate,
  requireTeacher,
  (req: AuthRequest, _res: Response, next) => {
    logger.debug('[QUESTION_LIST PUT] Body received from frontend', {
      questionListId: req.params.id,
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
    logger.debug('[QUESTION_LIST PUT] Validation passed, processing update', {
      questionListId: req.params.id,
      userId: req.user?.sub
    });

    const questionList = await updateQuestionListUseCase.execute({
      questionListId: req.params.id,
      dto: req.body,
      userId: req.user!.sub
    });
    
    logger.info('[QUESTION_LIST PUT] Question list updated successfully', {
      questionListId: req.params.id,
      updatedList: questionList
    });

    successResponse(res, questionList, 'Question list updated successfully');
  })
);

router.patch(
  '/:id/scoring',
  authenticate,
  requireTeacher,
  validateBody(UpdateQuestionListScoringDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[QUESTION_LIST PATCH SCORING] Scoring update received', {
      questionListId: req.params.id,
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
    
    const questionList = await updateListScoringUseCase.execute({
      questionListId: req.params.id,
      data
    });
    
    logger.info('[QUESTION_LIST PATCH SCORING] Scoring updated successfully', {
      questionListId: req.params.id,
      scoringMode: questionList.scoringMode,
      maxScore: questionList.maxScore
    });

    successResponse(res, questionList, 'Scoring configuration updated successfully');
  })
);

router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await deleteQuestionListUseCase.execute({
      questionListId: req.params.id,
      userId: req.user!.sub
    });
    
    successResponse(res, null, 'Question list deleted successfully');
  })
);

router.post(
  '/:id/questions',
  authenticate,
  requireTeacher,
  (req: AuthRequest, _res: Response, next) => {
    logger.debug('[QUESTION_LIST ADD QUESTION] Request received', {
      questionListId: req.params.id,
      bodyKeys: Object.keys(req.body || {}),
      questionId: req.body?.questionId,
      fullBody: JSON.stringify(req.body),
      userId: req.user?.sub
    });
    next();
  },
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const questionId = req.body.questionId;
    
    logger.debug('[QUESTION_LIST ADD QUESTION] Validating questionId', {
      questionListId: req.params.id,
      questionId,
      hasQuestionId: !!questionId
    });

    if (!questionId) {
      logger.warn('[QUESTION_LIST ADD QUESTION] questionId not provided', {
        questionListId: req.params.id,
        body: req.body
      });
      throw new ValidationError('Question ID is required', 'QUESTION_ID_REQUIRED');
    }
    
    logger.debug('[QUESTION_LIST ADD QUESTION] Calling addQuestionToListUseCase', {
      questionListId: req.params.id,
      questionId,
      userId: req.user?.sub
    });

    await addQuestionToListUseCase.execute({
      questionListId: req.params.id,
      questionId
    });
    
    logger.info('[QUESTION_LIST ADD QUESTION] Question added successfully', {
      questionListId: req.params.id,
      questionId,
      userId: req.user?.sub
    });

    successResponse(res, null, 'Question added to list');
  })
);

router.delete(
  '/:id/questions/:questionId',
  authenticate,
  requireTeacher,
  (req: AuthRequest, _res: Response, next) => {
    logger.debug('[QUESTION_LIST REMOVE QUESTION] Request received', {
      questionListId: req.params.id,
      questionId: req.params.questionId,
      userId: req.user?.sub
    });
    next();
  },
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[QUESTION_LIST REMOVE QUESTION] Calling removeQuestionFromListUseCase', {
      questionListId: req.params.id,
      questionId: req.params.questionId,
      userId: req.user?.sub
    });

    await removeQuestionFromListUseCase.execute({
      questionListId: req.params.id,
      questionId: req.params.questionId
    });
    
    logger.info('[QUESTION_LIST REMOVE QUESTION] Question removed successfully', {
      questionListId: req.params.id,
      questionId: req.params.questionId,
      userId: req.user?.sub
    });

    successResponse(res, null, 'Question removed from list');
  })
);

  return router;
}

export default createQuestionListController;

