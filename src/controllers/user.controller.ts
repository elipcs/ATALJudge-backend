import { Router, Response } from 'express';
import { UpdateProfileDTO, ChangePasswordDTO } from '../dtos';
import { validateBody, authenticate, requireProfessor, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { UnauthorizedError } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';
import { GetUserUseCase, UpdateProfileUseCase, ChangePasswordUseCase } from '../use-cases';

function createUserController(
  getUserUseCase: GetUserUseCase,
  updateProfileUseCase: UpdateProfileUseCase,
  changePasswordUseCase: ChangePasswordUseCase
): Router {
  const router = Router();

router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
    }
    
    const user = await getUserUseCase.execute(req.user.sub);
    
    successResponse(res, user, 'Perfil do usuário');
  })
);

router.put(
  '/profile',
  authenticate,
  validateBody(UpdateProfileDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
    }
    
    const user = await updateProfileUseCase.execute({ 
      userId: req.user.sub, 
      dto: req.body 
    });
    
    successResponse(res, user, 'Perfil atualizado com sucesso');
  })
);

router.post(
  '/change-password',
  authenticate,
  validateBody(ChangePasswordDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
    }
    
    await changePasswordUseCase.execute({
      userId: req.user.sub,
      dto: req.body
    });
    
    successResponse(res, null, 'Senha alterada com sucesso');
  })
);

router.get(
  '/:id',
  authenticate,
  requireProfessor,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await getUserUseCase.execute(req.params.id);
    
    successResponse(res, user, 'Dados do usuário');
  })
);

  return router;
}

export default createUserController;

