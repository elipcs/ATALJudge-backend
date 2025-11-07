import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseRepository } from '../../repositories';
import { TestCaseResponseDTO } from '../../dtos';
import { TestCaseMapper } from '../../mappers';

@injectable()
export class GetTestCasesByQuestionUseCase implements IUseCase<string, TestCaseResponseDTO[]> {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository
  ) {}

  async execute(questionId: string): Promise<TestCaseResponseDTO[]> {
    const testCases = await this.testCaseRepository.findByQuestion(questionId);
    
    return testCases.map(tc => TestCaseMapper.toDTO(tc));
  }
}
