import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { InviteRepository } from '../../repositories';
import { NotFoundError } from '../../utils';

/**
 * Use Case: Delete invite
 * 
 * Responsibilities:
 * - Validate invite existence
 * - Remove invite from database
 */
@injectable()
export class DeleteInviteUseCase implements IUseCase<string, void> {
  constructor(
    @inject(InviteRepository) private inviteRepository: InviteRepository
  ) {}

  async execute(inviteId: string): Promise<void> {
    // 1. Check if invite exists
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) {
      throw new NotFoundError('Invite not found', 'INVITE_NOT_FOUND');
    }

    // 2. Delete invite
    await this.inviteRepository.delete(inviteId);
  }
}
