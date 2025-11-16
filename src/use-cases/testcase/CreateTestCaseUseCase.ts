import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseRepository } from '../../repositories';
import { CreateTestCaseDTO, TestCaseResponseDTO } from '../../dtos';
import { TestCaseMapper } from '../../mappers';
import { ConflictError } from '../../utils';

@injectable()
export class CreateTestCaseUseCase implements IUseCase<CreateTestCaseDTO, TestCaseResponseDTO> {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository
  ) {}

  async execute(data: CreateTestCaseDTO): Promise<TestCaseResponseDTO> {
    // Check if a test case with same input/output combination already exists
    const duplicate = await this.testCaseRepository.findByInputOutput(
      data.questionId,
      data.input,
      data.expectedOutput
    );

    if (duplicate) {
      throw new ConflictError(
        'Test case with this input/output combination already exists',
        'TESTCASE_DUPLICATE'
      );
    }

    const testCase = await this.testCaseRepository.create({
      questionId: data.questionId,
      input: data.input,
      expectedOutput: data.expectedOutput,
      weight: data.weight ?? 1
    });
    
    return TestCaseMapper.toDTO(testCase);
  }
}
