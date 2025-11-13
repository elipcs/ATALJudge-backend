/**
 * @module controllers/user
 * @description REST API controller for user profile endpoints
 * Manages user profile retrieval, updates, and password changes
 * @class UserController
 */
import { Router, Response } from 'express';
import { UpdateProfileDTO, ChangePasswordDTO } from '../dtos';
import { validateBody, authenticate, requireProfessor, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { UnauthorizedError } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';
import { GetUserUseCase, GetUsersByRoleUseCase, UpdateProfileUseCase, ChangePasswordUseCase } from '../use-cases';

/**
 * User Controller
 * 
 * Handles user profile and account management endpoints.
 * Provides operations for retrieving user profiles, updating profile information, and changing passwords.
 * 
 * @module controllers/user
 */

/**
 * Create User Controller
 * 
 * Factory function that creates and configures the user routes router.
 * 
 * @param {GetUserUseCase} getUserUseCase - Use case for fetching user data
 * @param {UpdateProfileUseCase} updateProfileUseCase - Use case for updating user profile
 * @param {ChangePasswordUseCase} changePasswordUseCase - Use case for password changes
 * @returns {Router} Express router with user endpoints
 * 
 * Routes:
 * - GET /profile - Get current user profile (requires authentication)
 * - PUT /profile - Update current user profile (requires authentication)
 * - POST /change-password - Change user password (requires authentication)
 * - GET /:id - Get specific user profile (requires professor role)
 */
function createUserController(
  getUserUseCase: GetUserUseCase,
  getUsersByRoleUseCase: GetUsersByRoleUseCase,
  updateProfileUseCase: UpdateProfileUseCase,
  changePasswordUseCase: ChangePasswordUseCase
): Router {
  const router = Router();

/**
 * GET /profile
 * Get current user profile
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
    }
    
    const user = await getUserUseCase.execute(req.user.sub);
    
    successResponse(res, user, 'User profile');
  })
);

/**
 * PUT /profile
 * Update current user profile information
 */
router.put(
  '/profile',
  authenticate,
  validateBody(UpdateProfileDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
    }
    
    const user = await updateProfileUseCase.execute({ 
      userId: req.user.sub, 
      dto: req.body 
    });
    
    successResponse(res, user, 'Profile updated successfully');
  })
);

/**
 * POST /change-password
 * Change user password
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(ChangePasswordDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
    }
    
    await changePasswordUseCase.execute({
      userId: req.user.sub,
      dto: req.body
    });
    
    successResponse(res, null, 'Password changed successfully');
  })
);

/**
 * GET /role/:role
 * Get users by role (professor only)
 */
router.get(
  '/role/:role',
  authenticate,
  requireProfessor,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const users = await getUsersByRoleUseCase.execute(req.params.role);
    
    successResponse(res, users, 'Users by role');
  })
);

/**
 * GET /:id
 * Get user profile by ID (professor only)
 */
router.get(
  '/:id',
  authenticate,
  requireProfessor,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await getUserUseCase.execute(req.params.id);
    
    successResponse(res, user, 'User data');
  })
);

  return router;
}

export default createUserController;

