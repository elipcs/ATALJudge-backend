import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { AllowedIPRepository } from '../../repositories/AllowedIPRepository';
import { AllowedIPDTO, CreateAllowedIPDTO } from '../../dtos';
import { ConflictError, ValidationError } from '../../utils';
import { AllowedIPMapper } from '../../mappers';

@injectable()
export class CreateAllowedIPUseCase implements IUseCase<CreateAllowedIPDTO, AllowedIPDTO> {
  private readonly ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  constructor(
    @inject(AllowedIPRepository) private allowedIPRepository: AllowedIPRepository
  ) {}

  async execute(data: CreateAllowedIPDTO): Promise<AllowedIPDTO> {
    // Validate IP format
    if (!this.ipRegex.test(data.ip)) {
      throw new ValidationError('Invalid IP format', 'INVALID_IP_FORMAT');
    }

    // Check for duplicates
    const existingIP = await this.allowedIPRepository.findByIP(data.ip);
    if (existingIP) {
      throw new ConflictError('This IP is already registered', 'IP_ALREADY_EXISTS');
    }

    // Create allowed IP with active=true by default
    const allowedIP = await this.allowedIPRepository.create({
      ...data,
      active: true
    });

    return AllowedIPMapper.toDTO(allowedIP);
  }
}
