import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseRepository } from '../../repositories';
import { UpdateTestCaseDTO, TestCaseResponseDTO } from '../../dtos';
import { NotFoundError, InternalServerError, ConflictError } from '../../utils';
import { TestCaseMapper } from '../../mappers';
import { DeepPartial } from 'typeorm';
import { TestCase } from '../../models';

export interface UpdateTestCaseInput {
  id: string;
  data: UpdateTestCaseDTO;
}

@injectable()
export class UpdateTestCaseUseCase implements IUseCase<UpdateTestCaseInput, TestCaseResponseDTO> {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository
  ) {}

  async execute(input: UpdateTestCaseInput): Promise<TestCaseResponseDTO> {
    const { id, data } = input;

    const testCase = await this.testCaseRepository.findById(id);
    
    if (!testCase) {
      throw new NotFoundError('Test case not found', 'TESTCASE_NOT_FOUND');
    }
    
    // Check if input or output is being updated
    const inputChanged = data.input !== undefined && data.input !== testCase.input;
    const outputChanged = data.expectedOutput !== undefined && data.expectedOutput !== testCase.expectedOutput;

    // If either input or output is changing, check for duplicates
    if (inputChanged || outputChanged) {
      const newInput = data.input ?? testCase.input;
      const newOutput = data.expectedOutput ?? testCase.expectedOutput;

      const duplicate = await this.testCaseRepository.findByInputOutput(
        testCase.questionId,
        newInput,
        newOutput,
        id // Exclude current test case
      );

      if (duplicate) {
        throw new ConflictError(
          'Test case with this input/output combination already exists',
          'TESTCASE_DUPLICATE'
        );
      }
    }
    
    const updateData: DeepPartial<TestCase> = {};
    if (data.input !== undefined) updateData.input = data.input;
    if (data.expectedOutput !== undefined) updateData.expectedOutput = data.expectedOutput;
    if (data.weight !== undefined) updateData.weight = data.weight;
    
    const updated = await this.testCaseRepository.update(id, updateData);
    
    if (!updated) {
      throw new InternalServerError('Error updating test case', 'UPDATE_ERROR');
    }
    
    return TestCaseMapper.toDTO(updated);
  }
}
