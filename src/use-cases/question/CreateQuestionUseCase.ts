import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { CreateQuestionDTO, QuestionResponseDTO } from '../../dtos';
import { QuestionRepository, QuestionListRepository } from '../../repositories';
import { Question } from '../../models/Question';
import { QuestionMapper } from '../../mappers';
import { logger, NotFoundError } from '../../utils';

export interface CreateQuestionUseCaseInput {
  dto: CreateQuestionDTO;
}

/**
 * Use Case: Create new question
 * 
 * Responsibilities:
 * - Create Question entity
 * - Apply DTO data
 * - Save to database
 * - Return DTO
 */
@injectable()
export class CreateQuestionUseCase implements IUseCase<CreateQuestionUseCaseInput, QuestionResponseDTO> {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository,
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository
  ) {}

  async execute(input: CreateQuestionUseCaseInput): Promise<QuestionResponseDTO> {
    const { dto } = input;

    // 1. Create question instance
    const question = new Question();

    // 2. Apply DTO data
    QuestionMapper.applyCreateDTO(question, dto);

    // 3. Save to database
    const savedQuestion = await this.questionRepository.create(question);

    logger.info('[CreateQuestionUseCase] Question created', { 
      questionId: savedQuestion.id, 
      title: savedQuestion.title,
    });

    // 4. Optionally add to question list if provided
    if (dto.questionListId) {
      const questionList = await this.questionListRepository.findByIdWithRelations(dto.questionListId, true);
      
      if (!questionList) {
        throw new NotFoundError('Question list not found', 'LIST_NOT_FOUND');
      }

      if (!questionList.questions) {
        questionList.questions = [];
      }

      const alreadyAdded = questionList.questions.some(q => q.id === savedQuestion.id);
      if (!alreadyAdded) {
        questionList.questions.push(savedQuestion);
        await this.questionListRepository.save(questionList);
        
        logger.info('[CreateQuestionUseCase] Question added to list', {
          questionId: savedQuestion.id,
          questionListId: dto.questionListId
        });
      }
    }

    // 5. Return DTO
    return QuestionMapper.toDTO(savedQuestion);
  }
}
