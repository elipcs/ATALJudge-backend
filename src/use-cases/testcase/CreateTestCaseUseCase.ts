import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseRepository } from '../../repositories';
import { CreateTestCaseDTO, TestCaseResponseDTO } from '../../dtos';
import { TestCaseMapper } from '../../mappers';

@injectable()
export class CreateTestCaseUseCase implements IUseCase<CreateTestCaseDTO, TestCaseResponseDTO> {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository
  ) {}

  async execute(data: CreateTestCaseDTO): Promise<TestCaseResponseDTO> {
    const testCase = await this.testCaseRepository.create({
      questionId: data.questionId,
      input: data.input,
      expectedOutput: data.expectedOutput,
      isSample: data.isSample ?? false,
      weight: data.weight ?? 1
    });
    
    return TestCaseMapper.toDTO(testCase);
  }
}
