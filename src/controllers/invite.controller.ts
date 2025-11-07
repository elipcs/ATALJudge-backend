import { Router, Response } from 'express';
import { 
  CreateInviteUseCase, 
  GetAllInvitesUseCase, 
  ValidateInviteUseCase, 
  DeleteInviteUseCase, 
  RevokeInviteUseCase 
} from '../use-cases/invite';
import { CreateInviteDTO } from '../dtos';
import { validateBody, authenticate, requireTeacher, AuthRequest } from '../middlewares';
import { successResponse } from '../utils/responses';
import { logger, sanitizeForLog, ValidationError } from '../utils';
import { asyncHandler } from '../utils/asyncHandler';

function createInviteController(
  createInviteUseCase: CreateInviteUseCase,
  getAllInvitesUseCase: GetAllInvitesUseCase,
  validateInviteUseCase: ValidateInviteUseCase,
  deleteInviteUseCase: DeleteInviteUseCase,
  revokeInviteUseCase: RevokeInviteUseCase
): Router {
  const router = Router();

router.post(
  '/',
  authenticate,
  requireTeacher,
  validateBody(CreateInviteDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const invite = await createInviteUseCase.execute(req.body);
    
    successResponse(res, { invite }, 'Convite criado com sucesso', 201);
  })
);

router.post(
  '/create',
  authenticate,
  requireTeacher,
  validateBody(CreateInviteDTO),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const invite = await createInviteUseCase.execute(req.body);
    
    successResponse(res, { invite }, 'Convite criado com sucesso', 201);
  })
);

router.get(
  '/',
  authenticate,
  requireTeacher,
  asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
    const invites = await getAllInvitesUseCase.execute();
    
    successResponse(res, invites, 'Lista de convites');
  })
);

router.post(
  '/verify',
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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
    
    const invite = await validateInviteUseCase.execute(token);
    
    logger.info('[INVITE] Convite válido', { 
      id: invite.id, 
      role: invite.role, 
      currentUses: invite.currentUses,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt 
    });

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
  })
);

router.delete(
  '/:id',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await deleteInviteUseCase.execute(req.params.id);
    
    successResponse(res, null, 'Convite deletado com sucesso');
  })
);

router.post(
  '/:id/revoke',
  authenticate,
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    await revokeInviteUseCase.execute(req.params.id);
    
    successResponse(res, null, 'Convite revogado com sucesso');
  })
);

  return router;
}

export default createInviteController;

