import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListResponseDTO } from '../../dtos/QuestionListDtos';
import { QuestionListRepository } from '../../repositories';

export interface GetAllQuestionListsFilters {
  search?: string;
  classId?: string;
  status?: 'draft' | 'published';
}

/**
 * Use Case: Get all question lists with filters
 * 
 * Responsibilities:
 * - Find lists with optional filters
 * - Include questions and associated classes
 * - Apply search by title/description
 * - Filter by status (draft/published)
 * - Filter by class
 * - Order by creation date (most recent first)
 */
@injectable()
export class GetAllQuestionListsUseCase implements IUseCase<GetAllQuestionListsFilters, QuestionListResponseDTO[]> {
  constructor(
    @inject(QuestionListRepository) private listRepository: QuestionListRepository
  ) {}

  async execute(filters: GetAllQuestionListsFilters): Promise<QuestionListResponseDTO[]> {
    // 1. Create query builder with relationships
    const queryBuilder = this.listRepository
      .createQueryBuilder('list')
      .leftJoinAndSelect('list.questions', 'questions')
      .leftJoinAndSelect('list.classes', 'classes')
      .orderBy('list.createdAt', 'DESC');

    // 2. Apply search filter (title or description)
    if (filters.search) {
      queryBuilder.andWhere(
        '(list.title ILIKE :search OR list.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // 3. Apply class filter
    if (filters.classId) {
      queryBuilder.andWhere('classes.id = :classId', { classId: filters.classId });
    }

    // 4. Find lists
    const lists = await queryBuilder.getMany();

    // 5. Convert to DTOs
    return lists.map(list => new QuestionListResponseDTO({
      id: list.id,
      title: list.title,
      description: list.description,
      startDate: list.startDate.toISOString(),
      endDate: list.endDate.toISOString(),
      isRestricted: list.isRestricted,
      scoringMode: list.scoringMode,
      maxScore: list.maxScore,
      minQuestionsForMaxScore: list.minQuestionsForMaxScore,
      questionGroups: list.questionGroups,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      questionCount: list.questions?.length || 0,
      classIds: list.classes?.map(c => c.id) || []
    }));
  }
}
