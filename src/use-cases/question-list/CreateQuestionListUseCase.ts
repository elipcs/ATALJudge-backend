import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { CreateQuestionListDTO, QuestionListResponseDTO } from '../../dtos/QuestionListDtos';
import { QuestionListRepository, ClassRepository } from '../../repositories';
import { QuestionList } from '../../models/QuestionList';
import { logger } from '../../utils';

export interface CreateQuestionListUseCaseInput {
  dto: CreateQuestionListDTO;
  authorId?: string;
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
    @inject(QuestionListRepository) private listRepository: QuestionListRepository,
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(input: CreateQuestionListUseCaseInput): Promise<QuestionListResponseDTO> {
    const { dto, authorId } = input;

    // 1. Normalize question groups
    const normalizedGroups = (dto.questionGroups || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      questionIds: g.questionIds || [],
      weight: g.weight ?? 0,
      percentage: g.percentage
    }));

    // 2. Create QuestionList
    const list = new QuestionList();
    list.title = dto.title;
    list.description = dto.description;
    list.authorId = authorId;
    list.startDate = dto.startDate ? new Date(dto.startDate) : null as any;
    list.endDate = dto.endDate ? new Date(dto.endDate) : null as any;
    list.scoringMode = dto.scoringMode || 'simple';
    list.maxScore = dto.maxScore || 10;
    list.minQuestionsForMaxScore = dto.minQuestionsForMaxScore;
    list.questionGroups = normalizedGroups;
    list.isRestricted = dto.isRestricted || false;

    // 3. Save to database
    const savedList = await this.listRepository.create(list);

    // 4. Associate classes (if specified)
    if (dto.classIds && dto.classIds.length > 0) {
      const classes = await this.classRepository.findByIds(dto.classIds);
      savedList.classes = classes;
      const listWithClasses = await this.listRepository.save(savedList);
      
      logger.info('[CreateQuestionListUseCase] List created with classes', { 
        listId: listWithClasses.id, 
        classesCount: classes.length 
      });
      
      return this.toDTO(listWithClasses);
    }

    logger.info('[CreateQuestionListUseCase] List created', { listId: savedList.id });
    return this.toDTO(savedList);
  }

  private toDTO(list: QuestionList): QuestionListResponseDTO {
    return new QuestionListResponseDTO({
      id: list.id,
      title: list.title,
      description: list.description,
      startDate: list.startDate?.toISOString(),
      endDate: list.endDate?.toISOString(),
      scoringMode: list.scoringMode,
      maxScore: list.maxScore,
      minQuestionsForMaxScore: list.minQuestionsForMaxScore,
      questionGroups: list.questionGroups,
      isRestricted: list.isRestricted,
      calculatedStatus: list.getCalculatedStatus(),
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      questionCount: list.getQuestionCount(),
      classIds: list.classes?.map(c => c.id) || []
    });
  }
}
