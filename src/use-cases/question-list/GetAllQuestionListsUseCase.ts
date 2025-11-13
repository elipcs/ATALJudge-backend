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
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository
  ) {}

  async execute(filters: GetAllQuestionListsFilters): Promise<QuestionListResponseDTO[]> {
    // 1. Create query builder with relationships
    const queryBuilder = this.questionListRepository
      .createQueryBuilder('question_list')
      .leftJoinAndSelect('question_list.questions', 'questions')
      .leftJoinAndSelect('question_list.classes', 'classes')
      .orderBy('question_list.createdAt', 'DESC');

    // 2. Apply search filter (title or description)
    if (filters.search) {
      queryBuilder.andWhere(
        '(question_list.title ILIKE :search OR question_list.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // 3. Apply class filter
    if (filters.classId) {
      queryBuilder.andWhere('classes.id = :classId', { classId: filters.classId });
    }

    // 4. Find lists
    const questionLists = await queryBuilder.getMany();

    // 5. Convert to DTOs
    return questionLists.map(questionList => new QuestionListResponseDTO({
      id: questionList.id,
      title: questionList.title,
      description: questionList.description,
      startDate: questionList.startDate.toISOString(),
      endDate: questionList.endDate.toISOString(),
      isRestricted: questionList.isRestricted,
      countTowardScore: questionList.countTowardScore,
      scoringMode: questionList.scoringMode,
      maxScore: questionList.maxScore,
      minQuestionsForMaxScore: questionList.minQuestionsForMaxScore,
      questionGroups: questionList.questionGroups,
      createdAt: questionList.createdAt,
      updatedAt: questionList.updatedAt,
      questionCount: questionList.questions?.length || 0,
      classIds: questionList.classes?.map(c => c.id) || []
    }));
  }
}
