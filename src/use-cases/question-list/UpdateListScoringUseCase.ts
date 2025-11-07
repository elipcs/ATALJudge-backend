import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListRepository, GradeRepository } from '../../repositories';
import { QuestionListResponseDTO } from '../../dtos';
import { NotFoundError, logger } from '../../utils';
import { QuestionListMapper } from '../../mappers';
import { GradeService } from '../../services/GradeService';

export interface UpdateListScoringInput {
  questionListId: string;
  data: {
    scoringMode?: 'simple' | 'groups';
    maxScore?: number;
    minQuestionsForMaxScore?: number;
    questionGroups?: Array<{
      id?: string;
      name: string;
      questionIds: string[];
      weight?: number;
      percentage?: number;
    }>;
  };
}

@injectable()
export class UpdateListScoringUseCase implements IUseCase<UpdateListScoringInput, QuestionListResponseDTO> {
  constructor(
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(GradeRepository) private gradeRepository: GradeRepository,
    @inject(GradeService) private gradeService: GradeService
  ) {}

  async execute(input: UpdateListScoringInput): Promise<QuestionListResponseDTO> {
    const { questionListId, data } = input;

    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true, true);

    if (!questionList) {
      logger.warn('List not found to update scoring', { questionListId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    // Update scoring configuration
    if (data.scoringMode !== undefined) questionList.scoringMode = data.scoringMode;
    if (data.maxScore !== undefined) questionList.maxScore = data.maxScore;
    if (data.minQuestionsForMaxScore !== undefined) questionList.minQuestionsForMaxScore = data.minQuestionsForMaxScore;
    if (data.questionGroups !== undefined) {
      questionList.questionGroups = (data.questionGroups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        questionIds: g.questionIds || [],
        weight: g.weight ?? 0,
        percentage: g.percentage
      }));
    }

    await this.questionListRepository.save(questionList);

    // Recalculate all grades for the list
    try {
      const grades = await this.gradeRepository.findByList(questionListId);

      for (const grade of grades) {
        try {
          await this.gradeService.recalculateAndUpsertGrade(grade.studentId, questionListId);
        } catch (gradeError) {
          logger.error('Error recalculating individual grade', {
            questionListId,
            studentId: grade.studentId,
            error: gradeError instanceof Error ? gradeError.message : 'Unknown error'
          });
        }
      }

      logger.info('Grades recalculated after configuration update', {
        questionListId,
        totalGrades: grades.length
      });
    } catch (recalcError) {
      logger.error('Error recalculating grades after configuration update', {
        questionListId,
        error: recalcError instanceof Error ? recalcError.message : 'Unknown error'
      });
    }

    return QuestionListMapper.toDTO(questionList);
  }
}
