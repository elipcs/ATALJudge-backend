import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { AllowedIPRepository } from '../../repositories/AllowedIPRepository';
import { AllowedIPDTO } from '../../dtos';
import { AllowedIPMapper } from '../../mappers';

@injectable()
export class GetAllAllowedIPsUseCase implements IUseCase<void, AllowedIPDTO[]> {
  constructor(
    @inject(AllowedIPRepository) private allowedIPRepository: AllowedIPRepository
  ) {}

  async execute(): Promise<AllowedIPDTO[]> {
    const ips = await this.allowedIPRepository.findAll();
    return ips.map(ip => AllowedIPMapper.toDTO(ip));
  }
}
