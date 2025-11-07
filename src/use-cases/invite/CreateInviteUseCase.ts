import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { CreateInviteDTO, InviteResponseDTO } from '../../dtos';
import { InviteRepository, ClassRepository } from '../../repositories';
import { NotFoundError, ValidationError } from '../../utils';
import { InviteMapper } from '../../mappers';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use Case: Create invite
 * 
 * Responsibilities:
 * - Validate invite data
 * - Verify class existence (if classId provided)
 * - Generate unique token
 * - Create invite in database
 * - Return invite DTO
 */
@injectable()
export class CreateInviteUseCase implements IUseCase<CreateInviteDTO, InviteResponseDTO> {
  constructor(
    @inject(InviteRepository) private inviteRepository: InviteRepository,
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(input: CreateInviteDTO): Promise<InviteResponseDTO> {
    // 1. Validate basic data
    if (!input.role) {
      throw new ValidationError('Role is required', 'ROLE_REQUIRED');
    }

    if (input.maxUses && input.maxUses < 1) {
      throw new ValidationError('maxUses must be greater than 0', 'INVALID_MAX_USES');
    }

    // 2. If classId provided, validate class
    if (input.classId) {
      const classEntity = await this.classRepository.findById(input.classId);
      if (!classEntity) {
        throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');
      }
    }

    // 3. Generate unique token
    const token = uuidv4();

    // 4. Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + input.expirationDays);

    // 5. Create invite
    const invite = await this.inviteRepository.create({
      role: input.role,
      token,
      expiresAt,
      maxUses: input.maxUses,
      currentUses: 0,
      classId: input.classId,
      className: input.className,
      createdById: input.createdBy,
      creatorName: input.creatorName
    });

    // 6. Return DTO
    return InviteMapper.toDTO(invite);
  }
}
