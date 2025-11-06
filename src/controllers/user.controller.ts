import { Router, Response } from 'express';
import { UserService } from '../services';
import { UpdateProfileDTO, ChangePasswordDTO } from '../dtos';
import { validateBody, authenticate, requireProfessor, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { UnauthorizedError } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createUserController(userService: UserService): Router {
  const router = Router();

router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
    }
    
    const user = await userService.getUserById(req.user.sub);
    
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
    
    const user = await userService.updateProfile(req.user.sub, req.body);
    
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
    
    await userService.changePassword(req.user.sub, req.body);
    
    successResponse(res, null, 'Senha alterada com sucesso');
  })
);

router.get(
  '/',
  authenticate,
  requireProfessor,
  asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    const users = await userService.getAllUsers();
    
    successResponse(res, users, 'Lista de usuários');
  })
);

router.get(
  '/:id',
  authenticate,
  requireProfessor,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await userService.getUserById(req.params.id);
    
    successResponse(res, user, 'Dados do usuário');
  })
);

router.get(
  '/role/:role',
  authenticate,
  requireProfessor,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { role } = req.params;
    const users = await userService.getUsersByRole(role);
    successResponse(res, users, `Usuários com role: ${role}`);
  })
);

  return router;
}

export default createUserController;

