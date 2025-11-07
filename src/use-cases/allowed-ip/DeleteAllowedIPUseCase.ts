import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { AllowedIPRepository } from '../../repositories/AllowedIPRepository';
import { NotFoundError } from '../../utils';

@injectable()
export class DeleteAllowedIPUseCase implements IUseCase<string, void> {
  constructor(
    @inject(AllowedIPRepository) private allowedIPRepository: AllowedIPRepository
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.allowedIPRepository.delete(id);
    
    if (!deleted) {
      throw new NotFoundError('IP not found', 'IP_NOT_FOUND');
    }
  }
}
