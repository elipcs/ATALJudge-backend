import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { InviteResponseDTO } from '../../dtos';
import { InviteRepository } from '../../repositories';
import { NotFoundError, ValidationError } from '../../utils';
import { InviteMapper } from '../../mappers';

/**
 * Use Case: Validate invite
 * 
 * Responsibilities:
 * - Find invite by token
 * - Validate existence
 * - Validate expiration
 * - Validate usage limit
 * - Return invite DTO
 */
@injectable()
export class ValidateInviteUseCase implements IUseCase<string, InviteResponseDTO> {
  constructor(
    @inject(InviteRepository) private inviteRepository: InviteRepository
  ) {}

  async execute(token: string): Promise<InviteResponseDTO> {
    // 1. Find invite by token
    const invite = await this.inviteRepository.findByToken(token);

    // 2. Validate existence
    if (!invite) {
      throw new NotFoundError('Invite not found', 'INVITE_NOT_FOUND');
    }

    // 3. Validate expiration
    if (invite.expiresAt < new Date()) {
      throw new ValidationError('Invite expired', 'INVITE_EXPIRED');
    }

    // 4. Validate usage limit
    if (invite.maxUses && invite.currentUses >= invite.maxUses) {
      throw new ValidationError('Invite has reached maximum uses', 'INVITE_MAX_USES_REACHED');
    }

    // 5. Update last used timestamp
    invite.updatedAt = new Date();
    await this.inviteRepository.save(invite);

    // 6. Return DTO
    return InviteMapper.toDTO(invite);
  }
}
