import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { TestCaseRepository } from '../../repositories';
import { TestCaseResponseDTO } from '../../dtos';
import { TestCaseMapper } from '../../mappers';
import { logger } from '../../utils';

@injectable()
export class GetTestCasesByQuestionUseCase implements IUseCase<string, TestCaseResponseDTO[]> {
  constructor(
    @inject(TestCaseRepository) private testCaseRepository: TestCaseRepository
  ) {}

  async execute(questionId: string): Promise<TestCaseResponseDTO[]> {
    try {
      const testCases = await this.testCaseRepository.findByQuestion(questionId);
      
      // Mapear casos de teste, filtrando qualquer que cause erro
      const mappedCases: TestCaseResponseDTO[] = [];
      for (const tc of testCases) {
        try {
          const dto = TestCaseMapper.toDTO(tc);
          // Validar que o DTO tem campos essenciais
          if (dto.id && dto.questionId) {
            mappedCases.push(dto);
          } else {
            logger.warn(`Caso de teste inválido ignorado (id: ${tc.id}, questionId: ${tc.questionId})`);
          }
        } catch (error: any) {
          logger.error(`Erro ao mapear caso de teste ${tc.id}:`, error);
          // Continuar com os outros casos mesmo se um falhar
        }
      }
      
      return mappedCases;
    } catch (error: any) {
      logger.error(`Erro ao buscar casos de teste para questão ${questionId}:`, error);
      // Retornar array vazio em caso de erro para não quebrar o frontend
      return [];
    }
  }
}
