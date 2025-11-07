import { Invite } from '../models';
import { InviteResponseDTO } from '../dtos';

/**
 * Mapper: Invite Entity ↔ DTOs
 * 
 * Responsabilidades:
 * - Converter entidade Invite para InviteResponseDTO
 * - Garantir separação entre camada de domínio e apresentação
 */
export class InviteMapper {
  /**
   * Converte Invite entity para InviteResponseDTO
   */
  static toDTO(invite: Invite): InviteResponseDTO {
    return new InviteResponseDTO({
      id: invite.id,
      role: invite.role,
      token: invite.token,
      link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?invite=${invite.token}`,
      expiresAt: invite.expiresAt,
      currentUses: invite.currentUses,
      maxUses: invite.maxUses,
      classId: invite.classId,
      className: invite.className || invite.class?.name,
      createdById: invite.createdById,
      creatorName: invite.creatorName || invite.createdBy?.name,
      isUsed: invite.isUsed,
      usedAt: invite.usedAt,
      createdAt: invite.createdAt
    });
  }
}
