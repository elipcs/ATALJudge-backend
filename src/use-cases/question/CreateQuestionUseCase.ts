import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { CreateQuestionDTO, QuestionResponseDTO } from '../../dtos';
import { QuestionRepository } from '../../repositories';
import { Question } from '../../models/Question';
import { QuestionMapper } from '../../mappers';
import { logger } from '../../utils';

export interface CreateQuestionUseCaseInput {
  dto: CreateQuestionDTO;
  authorId: string;
}

/**
 * Use Case: Create new question
 * 
 * Responsibilities:
 * - Create Question entity
 * - Apply DTO data
 * - Set author
 * - Save to database
 * - Return DTO
 */
@injectable()
export class CreateQuestionUseCase implements IUseCase<CreateQuestionUseCaseInput, QuestionResponseDTO> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) {}

  async execute(input: CreateQuestionUseCaseInput): Promise<QuestionResponseDTO> {
    const { dto, authorId } = input;

    // 1. Create question instance
    const question = new Question();

    // 2. Apply DTO data
    QuestionMapper.applyCreateDTO(question, dto);

    // 3. Set author
    question.authorId = authorId;

    // 4. Save to database
    const savedQuestion = await this.questionRepository.create(question);

    logger.info('[CreateQuestionUseCase] Question created', { 
      questionId: savedQuestion.id, 
      title: savedQuestion.title,
      authorId 
    });

    // 5. Return DTO
    return QuestionMapper.toDTO(savedQuestion);
  }
}
