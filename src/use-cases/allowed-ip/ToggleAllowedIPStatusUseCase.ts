import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { AllowedIPRepository } from '../../repositories/AllowedIPRepository';
import { AllowedIPDTO } from '../../dtos';
import { NotFoundError } from '../../utils';
import { AllowedIPMapper } from '../../mappers';

@injectable()
export class ToggleAllowedIPStatusUseCase implements IUseCase<string, AllowedIPDTO> {
  constructor(
    @inject(AllowedIPRepository) private allowedIPRepository: AllowedIPRepository
  ) {}

  async execute(id: string): Promise<AllowedIPDTO> {
    const ip = await this.allowedIPRepository.toggleIPStatus(id);
    
    if (!ip) {
      throw new NotFoundError('IP not found', 'IP_NOT_FOUND');
    }

    return AllowedIPMapper.toDTO(ip);
  }
}
