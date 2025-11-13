/**
 * @module controllers/config
 * @description REST API controller for system configuration endpoints
 * Manages allowed IPs and system-level operations (reset)
 * @class ConfigController
 */
import { Router, Response } from 'express';
import { CreateAllowedIPDTO } from '../dtos';
import { validateBody, authenticate, requireProfessor, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { UnauthorizedError } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';
import {
  GetAllAllowedIPsUseCase,
  GetAllowedIPByIdUseCase,
  CreateAllowedIPUseCase,
  ToggleAllowedIPStatusUseCase,
  DeleteAllowedIPUseCase,
} from '../use-cases/allowed-ip';
import { PerformSystemResetUseCase } from '../use-cases/system-reset';

function createConfigController(
  getAllAllowedIPsUseCase: GetAllAllowedIPsUseCase,
  getAllowedIPByIdUseCase: GetAllowedIPByIdUseCase,
  createAllowedIPUseCase: CreateAllowedIPUseCase,
  toggleAllowedIPStatusUseCase: ToggleAllowedIPStatusUseCase,
  deleteAllowedIPUseCase: DeleteAllowedIPUseCase,
  performSystemResetUseCase: PerformSystemResetUseCase
): Router {
  const router = Router();

  router.get(
    '/allowed-ips',
    authenticate,
    requireProfessor,
    asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
      const allowedIPs = await getAllAllowedIPsUseCase.execute();
      successResponse(res, allowedIPs, 'List of allowed IPs');
    })
  );

  router.get(
    '/allowed-ips/:id',
    authenticate,
    requireProfessor,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const allowedIP = await getAllowedIPByIdUseCase.execute(req.params.id);
      successResponse(res, allowedIP, 'IP found');
    })
  );

  router.post(
    '/allowed-ips',
    authenticate,
    requireProfessor,
    validateBody(CreateAllowedIPDTO),
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const allowedIP = await createAllowedIPUseCase.execute(req.body);
      successResponse(res, allowedIP, 'IP added successfully', 201);
    })
  );

  router.put(
    '/allowed-ips/:id/toggle',
    authenticate,
    requireProfessor,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      const allowedIP = await toggleAllowedIPStatusUseCase.execute(req.params.id);
      successResponse(res, allowedIP, 'IP status changed');
    })
  );

  router.delete(
    '/allowed-ips/:id',
    authenticate,
    requireProfessor,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      await deleteAllowedIPUseCase.execute(req.params.id);
      successResponse(res, null, 'IP removed successfully');
    })
  );

  router.post(
    '/system-reset',
    authenticate,
    requireProfessor,
    asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated', 'UNAUTHORIZED');
      }

      const resetOptions = {
        resetSubmissions: req.body.resetSubmissions || false,
        resetStudents: req.body.resetStudents || false,
        resetClasses: req.body.resetClasses || false,
        resetLists: req.body.resetLists || false,
        resetMonitors: req.body.resetMonitors || false,
        resetProfessors: req.body.resetProfessors || false,
        resetInvites: req.body.resetInvites || false,
        resetAllowedIPs: req.body.resetAllowedIPs || false,
      };

      const result = await performSystemResetUseCase.execute({
        resetOptions,
        currentUserId: req.user.sub
      });

      successResponse(res, result, 'System reset completed successfully');
    })
  );

  return router;
}

export default createConfigController;
