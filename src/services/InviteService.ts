/**
 * @module services/InviteService
 * @description Service to manage registration invitations in the system.
 * Provides operations to create, validate, consume and delete invitations for
 * new users to register and join classes.
 * @class InviteService
 */
import { injectable, inject } from 'tsyringe';
import { InviteRepository } from '../repositories';
import { Invite } from '../models/Invite';
import { CreateInviteDTO, InviteResponseDTO } from '../dtos';
import * as crypto from 'crypto';
import { NotFoundError, ValidationError } from '../utils';

@injectable()
export class InviteService {
  constructor(
    @inject(InviteRepository) private inviteRepository: InviteRepository
  ) { }

  async createInvite(dto: CreateInviteDTO): Promise<InviteResponseDTO> {

    const token = this.generateToken();

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

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${baseUrl}/cadastro?token=${savedInvite.token}`;

    return new InviteResponseDTO({
      ...savedInvite,
      link
    });
  }

  async getAllInvites(): Promise<InviteResponseDTO[]> {
    const invites = await this.inviteRepository.findAll();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return invites.map(invite => new InviteResponseDTO({
      ...invite,
      link: `${baseUrl}/cadastro?token=${invite.token}`
    }));
  }

  async getInvitesByCreator(createdById: string): Promise<InviteResponseDTO[]> {
    const invites = await this.inviteRepository.findByCreator(createdById);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return invites.map(invite => new InviteResponseDTO({
      ...invite,
      link: `${baseUrl}/cadastro?token=${invite.token}`
    }));
  }

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

  async useInvite(token: string): Promise<void> {
    const invite = await this.inviteRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundError('Convite não encontrado', 'INVITE_NOT_FOUND');
    }

    if (!invite.isValid()) {
      throw new ValidationError('Convite não pode ser usado', 'INVITE_CANNOT_BE_USED');
    }

    invite.incrementUses();

    // Force update to ensure currentUses is persisted
    await this.inviteRepository.update(invite.id, {
      currentUses: invite.currentUses,
      isUsed: invite.isUsed,
      usedAt: invite.usedAt
    });
  }

  async deleteInvite(inviteId: string): Promise<void> {
    const deleted = await this.inviteRepository.delete(inviteId);

    if (!deleted) {
      throw new NotFoundError('Convite não encontrado', 'INVITE_NOT_FOUND');
    }
  }

  async revokeInvite(inviteId: string): Promise<void> {
    const invite = await this.inviteRepository.findById(inviteId);

    if (!invite) {
      throw new NotFoundError('Convite não encontrado', 'INVITE_NOT_FOUND');
    }

    invite.isUsed = true;
    invite.usedAt = new Date();
    invite.currentUses = invite.maxUses;

    await this.inviteRepository.save(invite);
  }

  async cleanupExpiredInvites(): Promise<number> {
    return this.inviteRepository.deleteExpired();
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

