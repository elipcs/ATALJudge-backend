import { Router, Response } from 'express';
import { UserService } from '../services';
import { UpdateProfileDTO, ChangePasswordDTO } from '../dtos';
import { validateBody, authenticate, requireProfessor, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { UnauthorizedError } from '../utils';

function createUserController(userService: UserService): Router {
  const router = Router();

/**
 * GET /api/users/profile
 * Retorna perfil do usuário autenticado
 */
router.get(
  '/profile',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
      }
      
      const user = await userService.getUserById(req.user.userId);
      
      successResponse(res, user, 'Perfil do usuário');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * PUT /api/users/profile
 * Atualiza perfil do usuário autenticado
 */
router.put(
  '/profile',
  authenticate,
  validateBody(UpdateProfileDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
      }
      
      const user = await userService.updateProfile(req.user.userId, req.body);
      
      successResponse(res, user, 'Perfil atualizado com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/users/change-password
 * Altera senha do usuário autenticado
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(ChangePasswordDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
      }
      
      await userService.changePassword(req.user.userId, req.body);
      
      successResponse(res, null, 'Senha alterada com sucesso');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/users
 * Lista todos os usuários (apenas professores)
 */
router.get(
  '/',
  authenticate,
  requireProfessor,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const users = await userService.getAllUsers();
      
      successResponse(res, users, 'Lista de usuários');
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/users/:id
 * Busca usuário por ID (apenas professores)
 */
router.get(
  '/:id',
  authenticate,
  requireProfessor,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await userService.getUserById(req.params.id);
      
      successResponse(res, user, 'Dados do usuário');
    } catch (error) {
      throw error;
    }
  }
);

  return router;
}

export default createUserController;

