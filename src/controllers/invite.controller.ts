import { Router, Response } from 'express';
import { InviteService } from '../services';
import { CreateInviteDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { logger, sanitizeForLog, ValidationError } from '../utils';

function createInviteController(inviteService: InviteService): Router {
  const router = Router();

/**
 * POST /api/invites
 * Cria um novo convite (apenas professores)
 */
router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateInviteDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const invite = await inviteService.createInvite(req.body);
      
      successResponse(res, { invite }, 'Convite criado com sucesso', 201);
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/invites/create
 * Alias para POST /api/invites (compatibilidade com frontend)
 */
router.post(
  '/create',
  authenticate,
  requireTeacher,
  validateBody(CreateInviteDTO),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const invite = await inviteService.createInvite(req.body);
      
      successResponse(res, { invite }, 'Convite criado com sucesso', 201);
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * GET /api/invites
 * Lista todos os convites (apenas professores/assistentes)
 */
router.get(
  '/',
  authenticate,
  requireTeacher,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const invites = await inviteService.getAllInvites();
      
      successResponse(res, invites, 'Lista de convites');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * POST /api/invites/verify
 * Verifica/valida um convite pelo token
 */
router.post(
  '/verify',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      logger.debug('[INVITE] Body recebido', { 
        body: sanitizeForLog(req.body), 
        contentType: req.headers['content-type'] 
      });
      
      const { token } = req.body;
      
      logger.debug('[INVITE] Verificando convite', { 
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'não fornecido' 
      });
      
      if (!token) {
        logger.warn('[INVITE] Token não fornecido no body');
        throw new ValidationError('Token é obrigatório', 'TOKEN_REQUIRED');
      }
      
      const invite = await inviteService.validateInvite(token);
      
      logger.info('[INVITE] Convite válido', { 
        id: invite.id, 
        role: invite.role, 
        currentUses: invite.currentUses,
        maxUses: invite.maxUses,
        expiresAt: invite.expiresAt 
      });
      
      // Formatar resposta como frontend espera
      const inviteData = {
        id: invite.id,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt,
        currentUses: invite.currentUses,
        maxUses: invite.maxUses,
        classId: invite.classId,
        className: invite.className,
        createdBy: invite.createdById,
        creatorName: invite.creatorName
      };
      
      successResponse(res, inviteData, 'Convite válido');
    } catch (error) {
      logger.error('[INVITE] Erro ao validar convite', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * DELETE /api/invites/:id
 * Deleta um convite permanentemente (apenas professores/assistentes)
 */
router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await inviteService.deleteInvite(req.params.id);
      
      successResponse(res, null, 'Convite deletado com sucesso');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

/**
 * POST /api/invites/:id/revoke
 * Revoga um convite (alias para compatibilidade com frontend)
 */
router.post(
  '/:id/revoke',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await inviteService.revokeInvite(req.params.id);
      
      successResponse(res, null, 'Convite revogado com sucesso');
    } catch (error) {
      // Erros são tratados pelo middleware global
      throw error;
    }
  }
);

  return router;
}

export default createInviteController;

