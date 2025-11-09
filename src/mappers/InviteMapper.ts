/**
 * Invite Data Mapper
 * 
 * Maps between Invite domain models and DTOs.
 * Handles conversion of Invite entities to data transfer objects for API responses.
 * 
 * @module mappers/InviteMapper
 */
import { Invite } from '../models';
import { InviteResponseDTO } from '../dtos';

/**
 * Invite Mapper Class
 * 
 * Provides static methods for converting between Invite domain objects and DTOs.
 * Ensures separation between domain layer and presentation layer.
 * 
 * @class InviteMapper
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
      link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cadastro?token=${invite.token}`,
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
