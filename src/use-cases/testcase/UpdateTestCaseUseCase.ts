import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseRepository } from '../../repositories';
import { UpdateTestCaseDTO, TestCaseResponseDTO } from '../../dtos';
import { NotFoundError, InternalServerError } from '../../utils';
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
    
    const updateData: DeepPartial<TestCase> = {};
    if (data.input !== undefined) updateData.input = data.input;
    if (data.expectedOutput !== undefined) updateData.expectedOutput = data.expectedOutput;
    if (data.isSample !== undefined) updateData.isSample = data.isSample;
    if (data.weight !== undefined) updateData.weight = data.weight;
    
    const updated = await this.testCaseRepository.update(id, updateData);
    
    if (!updated) {
      throw new InternalServerError('Error updating test case', 'UPDATE_ERROR');
    }
    
    return TestCaseMapper.toDTO(updated);
  }
}
