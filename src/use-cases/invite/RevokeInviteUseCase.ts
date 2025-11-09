import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { InviteRepository } from '../../repositories';
import { NotFoundError, ValidationError } from '../../utils';

/**
 * Use Case: Revoke invite
 * 
 * Responsibilities:
 * - Validate invite existence
 * - Mark as expired (set expiration date to past)
 * - Save change
 */
@injectable()
export class RevokeInviteUseCase implements IUseCase<string, void> {
  constructor(
    @inject(InviteRepository) private inviteRepository: InviteRepository
  ) {}

  async execute(inviteId: string): Promise<void> {
    // 1. Check if invite exists
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) {
      throw new NotFoundError('Invite not found', 'INVITE_NOT_FOUND');
    }

    // 2. Check if already expired
    if (invite.expiresAt < new Date()) {
      throw new ValidationError('Invite is already expired', 'INVITE_ALREADY_EXPIRED');
    }

    // 3. Revoke (mark as expired)
    invite.expiresAt = new Date(Date.now() - 1000); // 1 second in the past
    invite.updatedAt = new Date();
    await this.inviteRepository.save(invite);
  }
}
