import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { CreateQuestionListDTO, QuestionListResponseDTO } from '../../dtos/QuestionListDtos';
import { QuestionListRepository, ClassRepository } from '../../repositories';
import { QuestionList } from '../../models/QuestionList';
import { logger } from '../../utils';

export interface CreateQuestionListUseCaseInput {
  dto: CreateQuestionListDTO;
}

/**
 * Use Case: Create new question list
 * 
 * Responsibilities:
 * - Create QuestionList
 * - Normalize question groups
 * - Associate classes (if specified)
 * - Save to database
 */
@injectable()
export class CreateQuestionListUseCase implements IUseCase<CreateQuestionListUseCaseInput, QuestionListResponseDTO> {
  constructor(
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(input: CreateQuestionListUseCaseInput): Promise<QuestionListResponseDTO> {
    const { dto } = input;

    // 1. Normalize question groups
    const normalizedGroups = (dto.questionGroups || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      questionIds: g.questionIds || [],
      weight: g.weight ?? 0,
      percentage: g.percentage
    }));

    // 2. Create QuestionList
    const questionList = new QuestionList();
    questionList.title = dto.title;
    questionList.description = dto.description;
    questionList.startDate = dto.startDate ? new Date(dto.startDate) : null as any;
    questionList.endDate = dto.endDate ? new Date(dto.endDate) : null as any;
    questionList.scoringMode = dto.scoringMode || 'simple';
    questionList.maxScore = dto.maxScore || 10;
    questionList.minQuestionsForMaxScore = dto.minQuestionsForMaxScore;
    questionList.questionGroups = normalizedGroups;
    questionList.isRestricted = dto.isRestricted || false;

    // 3. Save to database
    const savedList = await this.questionListRepository.create(questionList);

    // 4. Associate classes (if specified)
    if (dto.classIds && dto.classIds.length > 0) {
      const classes = await this.classRepository.findByIds(dto.classIds);
      savedList.classes = classes;
      const questionListWithClasses = await this.questionListRepository.save(savedList);
      
      logger.info('[CreateQuestionListUseCase] List created with classes', { 
        questionListId: questionListWithClasses.id, 
        classesCount: classes.length 
      });
      
      return this.toDTO(questionListWithClasses);
    }

    logger.info('[CreateQuestionListUseCase] List created', { questionListId: savedList.id });
    return this.toDTO(savedList);
  }

  private toDTO(questionList: QuestionList): QuestionListResponseDTO {
    return new QuestionListResponseDTO({
      id: questionList.id,
      title: questionList.title,
      description: questionList.description,
      startDate: questionList.startDate?.toISOString(),
      endDate: questionList.endDate?.toISOString(),
      scoringMode: questionList.scoringMode,
      maxScore: questionList.maxScore,
      minQuestionsForMaxScore: questionList.minQuestionsForMaxScore,
      questionGroups: questionList.questionGroups,
      isRestricted: questionList.isRestricted,
      countTowardScore: questionList.countTowardScore,
      calculatedStatus: questionList.getCalculatedStatus(),
      createdAt: questionList.createdAt,
      updatedAt: questionList.updatedAt,
      questionCount: questionList.getQuestionCount(),
      classIds: questionList.classes?.map(c => c.id) || []
    });
  }
}
