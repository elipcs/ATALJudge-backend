/**
 * @module controllers/class
 * @description REST API controller for class endpoints
 * Manages class creation, retrieval, updates, and student enrollment
 * @class ClassController
 */
import { Router, Response } from 'express';
import { CreateClassDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';
import {
  CreateClassUseCase,
  GetAllClassesUseCase,
  GetClassByIdUseCase,
  UpdateClassUseCase,
  DeleteClassUseCase,
  GetClassStudentsUseCase,
  AddStudentToClassUseCase,
  RemoveStudentFromClassUseCase
} from '../use-cases/class';

function createClassController(
  createClassUseCase: CreateClassUseCase,
  getAllClassesUseCase: GetAllClassesUseCase,
  getClassByIdUseCase: GetClassByIdUseCase,
  updateClassUseCase: UpdateClassUseCase,
  deleteClassUseCase: DeleteClassUseCase,
  getClassStudentsUseCase: GetClassStudentsUseCase,
  addStudentToClassUseCase: AddStudentToClassUseCase,
  removeStudentFromClassUseCase: RemoveStudentFromClassUseCase
): Router {
  const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const includeRelations = req.query.include === 'relations';
    const classes = await getAllClassesUseCase.execute({ includeRelations });
    
    successResponse(res, classes, 'List of classes');
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const includeRelations = req.query.include === 'relations';
    const classData = await getClassByIdUseCase.execute({ 
      classId: req.params.id, 
      includeRelations 
    });
    
    successResponse(res, classData, 'Class found');
  })
);

router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateClassDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    logger.debug('[CREATE CLASS] Body recebido', { body: req.body, userId: req.user?.sub });
    
    const classData = await createClassUseCase.execute({
      data: req.body,
      userId: req.user?.sub!
    });
    
    logger.info('[CREATE CLASS] Class created successfully', { classId: classData.id });
    successResponse(res, classData, 'Class created successfully', 201);
  })
);

router.put(
  '/:id',
  authenticate,
  validateBody(CreateClassDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const classData = await updateClassUseCase.execute({
      classId: req.params.id,
      data: req.body,
      userId: req.user?.sub
    });
    
    successResponse(res, classData, 'Class updated successfully');
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await deleteClassUseCase.execute({
      classId: req.params.id,
      userId: req.user?.sub
    });
    
    successResponse(res, null, 'Class deleted successfully');
  })
);

router.get(
  '/:id/students',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const students = await getClassStudentsUseCase.execute(req.params.id);
    
    successResponse(res, { students }, 'Alunos da turma');
  })
);

router.post(
  '/:id/students',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { studentId } = req.body;
    
    if (!studentId) {
      errorResponse(res, 'Student ID is required', 'VALIDATION_ERROR', 400);
      return;
    }
    
    await addStudentToClassUseCase.execute({
      classId: req.params.id,
      studentId
    });
    
    successResponse(res, null, 'Student added to class');
  })
);

router.delete(
  '/:id/students/:studentId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await removeStudentFromClassUseCase.execute({
      classId: req.params.id,
      studentId: req.params.studentId
    });
    
    successResponse(res, null, 'Aluno removido da turma');
  })
);

  return router;
}

export default createClassController;

