import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseRepository } from '../../repositories';
import { TestCaseResponseDTO } from '../../dtos';
import { NotFoundError } from '../../utils';
import { TestCaseMapper } from '../../mappers';

@injectable()
export class GetTestCaseByIdUseCase implements IUseCase<string, TestCaseResponseDTO> {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository
  ) {}

  async execute(id: string): Promise<TestCaseResponseDTO> {
    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Test case not found', 'TESTCASE_NOT_FOUND');
    }
    
    return TestCaseMapper.toDTO(testCase);
  }
}
