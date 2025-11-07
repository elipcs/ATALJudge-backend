import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseRepository } from '../../repositories';
import { NotFoundError } from '../../utils';

@injectable()
export class DeleteTestCaseUseCase implements IUseCase<string, void> {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository
  ) {}

  async execute(id: string): Promise<void> {
    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Test case not found', 'TESTCASE_NOT_FOUND');
    }
    
    await this.testCaseRepository.delete(id);
  }
}
