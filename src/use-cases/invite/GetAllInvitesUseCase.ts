import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { InviteResponseDTO } from '../../dtos';
import { InviteRepository } from '../../repositories';
import { InviteMapper } from '../../mappers';

/**
 * Use Case: Get all invites
 * 
 * Responsibilities:
 * - Find all invites
 * - Include relationships (class, creator)
 * - Convert to DTOs
 * - Return list of invites
 */
@injectable()
export class GetAllInvitesUseCase implements IUseCase<void, InviteResponseDTO[]> {
  constructor(
    @inject(InviteRepository) private inviteRepository: InviteRepository
  ) {}

  async execute(): Promise<InviteResponseDTO[]> {
    // 1. Find all invites with relationships
    const invites = await this.inviteRepository.findAll();

    // 2. Convert to DTOs
    return invites.map(invite => InviteMapper.toDTO(invite));
  }
}
