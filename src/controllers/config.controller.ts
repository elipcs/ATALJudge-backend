import { Router, Response } from 'express';
import { AllowedIPService, SystemResetService } from '../services';
import { CreateAllowedIPDTO } from '../dtos';
import { validateBody, authenticate, requireProfessor, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { UnauthorizedError } from '../utils';

function createConfigController(
  allowedIPService: AllowedIPService,
  systemResetService: SystemResetService
): Router {
  const router = Router();

  router.get(
    '/allowed-ips',
    authenticate,
    requireProfessor,
    async (_req: AuthRequest, res: Response): Promise<void> => {
      try {
        const allowedIPs = await allowedIPService.getAllowedIPs();
        successResponse(res, allowedIPs, 'Lista de IPs permitidos');
      } catch (error) {
        throw error;
      }
    }
  );

  router.get(
    '/allowed-ips/:id',
    authenticate,
    requireProfessor,
    async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const allowedIP = await allowedIPService.getIPById(req.params.id);
        successResponse(res, allowedIP, 'IP encontrado');
      } catch (error) {
        throw error;
      }
    }
  );

  router.post(
    '/allowed-ips',
    authenticate,
    requireProfessor,
    validateBody(CreateAllowedIPDTO),
    async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const allowedIP = await allowedIPService.createAllowedIP(req.body);
        successResponse(res, allowedIP, 'IP adicionado com sucesso', 201);
      } catch (error) {
        throw error;
      }
    }
  );

  router.put(
    '/allowed-ips/:id/toggle',
    authenticate,
    requireProfessor,
    async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const allowedIP = await allowedIPService.toggleIPStatus(req.params.id);
        successResponse(res, allowedIP, 'Status do IP alterado');
      } catch (error) {
        throw error;
      }
    }
  );

  router.delete(
    '/allowed-ips/:id',
    authenticate,
    requireProfessor,
    async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        await allowedIPService.deleteAllowedIP(req.params.id);
        successResponse(res, null, 'IP removido com sucesso');
      } catch (error) {
        throw error;
      }
    }
  );

  router.post(
    '/system-reset',
    authenticate,
    requireProfessor,
    async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED');
        }

        const resetOptions = {
          resetSubmissions: req.body.resetSubmissions || false,
          resetStudents: req.body.resetStudents || false,
          resetClasses: req.body.resetClasses || false,
          resetLists: req.body.resetLists || false,
          resetMonitors: req.body.resetMonitors || false,
          resetProfessors: req.body.resetProfessors || false,
          resetInvites: req.body.resetInvites || false,
        };

        const result = await systemResetService.performSystemReset(
          resetOptions,
          req.user.sub
        );

        successResponse(res, result, 'Reset do sistema concluído com sucesso');
      } catch (error) {
        throw error;
      }
    }
  );

  return router;
}

export default createConfigController;
