import { InviteRepository } from '../repositories';
import { Invite } from '../models/Invite';
import { CreateInviteDTO, InviteResponseDTO } from '../dtos';
import * as crypto from 'crypto';
import { NotFoundError, ValidationError } from '../utils';

/**
 * Serviço de convites
 */
export class InviteService {
  private inviteRepository: InviteRepository;

  constructor(inviteRepository: InviteRepository) {
    this.inviteRepository = inviteRepository;
  }

  /**
   * Cria um novo convite
   */
  async createInvite(dto: CreateInviteDTO): Promise<InviteResponseDTO> {
    // Gerar token único
    const token = this.generateToken();

    // Criar convite
    const invite = new Invite();
    invite.role = dto.role;
    invite.token = token;
    invite.maxUses = dto.maxUses;
    invite.currentUses = 0;
    invite.classId = dto.classId;
    invite.className = dto.className;
    invite.createdById = dto.createdBy;
    invite.creatorName = dto.creatorName;
    invite.expiresAt = new Date(Date.now() + dto.expirationDays * 24 * 60 * 60 * 1000);

    const savedInvite = await this.inviteRepository.create(invite);

    // Gerar link do convite
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${baseUrl}/cadastro?token=${savedInvite.token}`;

    return new InviteResponseDTO({
      ...savedInvite,
      link
    });
  }

  /**
   * Lista todos os convites
   */
  async getAllInvites(): Promise<InviteResponseDTO[]> {
    const invites = await this.inviteRepository.findAll();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return invites.map(invite => new InviteResponseDTO({
      ...invite,
      link: `${baseUrl}/cadastro?token=${invite.token}`
    }));
  }

  /**
   * Lista convites criados por um usuário
   */
  async getInvitesByCreator(createdById: string): Promise<InviteResponseDTO[]> {
    const invites = await this.inviteRepository.findByCreator(createdById);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return invites.map(invite => new InviteResponseDTO({
      ...invite,
      link: `${baseUrl}/cadastro?token=${invite.token}`
    }));
  }

  /**
   * Valida um convite
   */
  async validateInvite(token: string): Promise<InviteResponseDTO> {
    const invite = await this.inviteRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundError('Convite não encontrado', 'INVITE_NOT_FOUND');
    }

    if (!invite.isValid()) {
      if (invite.isExpired()) {
        throw new ValidationError('Convite expirado', 'INVITE_EXPIRED');
      }
      if (invite.currentUses >= invite.maxUses) {
        throw new ValidationError('Convite já atingiu o número máximo de usos', 'INVITE_MAX_USES');
      }
      throw new ValidationError('Convite inválido', 'INVITE_INVALID');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return new InviteResponseDTO({
      ...invite,
      link: `${baseUrl}/cadastro?token=${invite.token}`
    });
  }

  /**
   * Usa um convite (incrementa contador)
   */
  async useInvite(token: string): Promise<void> {
    const invite = await this.inviteRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundError('Convite não encontrado', 'INVITE_NOT_FOUND');
    }

    if (!invite.isValid()) {
      throw new ValidationError('Convite não pode ser usado', 'INVITE_CANNOT_BE_USED');
    }

    invite.incrementUses();
    await this.inviteRepository.update(invite.id, invite);
  }

  /**
   * Deleta um convite permanentemente
   */
  async deleteInvite(inviteId: string): Promise<void> {
    const deleted = await this.inviteRepository.delete(inviteId);
    
    if (!deleted) {
      throw new NotFoundError('Convite não encontrado', 'INVITE_NOT_FOUND');
    }
  }

  /**
   * Revoga um convite (marca como usado sem deletar)
   */
  async revokeInvite(inviteId: string): Promise<void> {
    const invite = await this.inviteRepository.findById(inviteId);
    
    if (!invite) {
      throw new NotFoundError('Convite não encontrado', 'INVITE_NOT_FOUND');
    }
    
    // Marcar como usado sem deletar (preserva histórico)
    invite.isUsed = true;
    invite.usedAt = new Date();
    
    // Marcar como esgotado também para que isValid() retorne false
    invite.currentUses = invite.maxUses;
    
    await this.inviteRepository.update(inviteId, invite);
  }

  /**
   * Remove convites expirados
   */
  async cleanupExpiredInvites(): Promise<number> {
    return this.inviteRepository.deleteExpired();
  }

  /**
   * Gera um token único
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

