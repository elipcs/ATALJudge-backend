import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { QuestionListRepository, GradeRepository } from '../../repositories';
import { QuestionListResponseDTO } from '../../dtos';
import { NotFoundError, logger } from '../../utils';
import { QuestionListMapper } from '../../mappers';
import { GradeService } from '../../services/GradeService';

export interface UpdateListScoringInput {
  listId: string;
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
    @inject(QuestionListRepository) private listRepository: QuestionListRepository,
    @inject(GradeRepository) private gradeRepository: GradeRepository,
    @inject(GradeService) private gradeService: GradeService
  ) {}

  async execute(input: UpdateListScoringInput): Promise<QuestionListResponseDTO> {
    const { listId, data } = input;

    const list = await this.listRepository.findByIdWithRelations(listId, true, true);

    if (!list) {
      logger.warn('List not found to update scoring', { listId });
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    // Update scoring configuration
    if (data.scoringMode !== undefined) list.scoringMode = data.scoringMode;
    if (data.maxScore !== undefined) list.maxScore = data.maxScore;
    if (data.minQuestionsForMaxScore !== undefined) list.minQuestionsForMaxScore = data.minQuestionsForMaxScore;
    if (data.questionGroups !== undefined) {
      list.questionGroups = (data.questionGroups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        questionIds: g.questionIds || [],
        weight: g.weight ?? 0,
        percentage: g.percentage
      }));
    }

    await this.listRepository.save(list);

    // Recalculate all grades for the list
    try {
      const grades = await this.gradeRepository.findByList(listId);

      for (const grade of grades) {
        try {
          await this.gradeService.recalculateAndUpsertGrade(grade.studentId, listId);
        } catch (gradeError) {
          logger.error('Error recalculating individual grade', {
            listId,
            studentId: grade.studentId,
            error: gradeError instanceof Error ? gradeError.message : 'Unknown error'
          });
        }
      }

      logger.info('Grades recalculated after configuration update', {
        listId,
        totalGrades: grades.length
      });
    } catch (recalcError) {
      logger.error('Error recalculating grades after configuration update', {
        listId,
        error: recalcError instanceof Error ? recalcError.message : 'Unknown error'
      });
    }

    return QuestionListMapper.toDTO(list);
  }
}
