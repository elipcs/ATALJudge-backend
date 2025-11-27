import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { GradeResponseDTO } from '../../dtos';
import { GradeRepository, QuestionListRepository, SubmissionRepository } from '../../repositories';
import { Grade } from '../../models/Grade';
import { NotFoundError, logger } from '../../utils';
import { GradeMapper } from '../../mappers';

export interface CalculateGradeUseCaseInput {
  studentId: string;
  questionListId: string;
}

/**
 * Use Case: Calculate student grade for a list
 * 
 * Responsibilities:
 * - Find list with questions
 * - Find student submissions
 * - Calculate score based on groups (if applicable)
 * - Create or update grade in database
 * - Return calculated grade
 */
@injectable()
export class CalculateGradeUseCase implements IUseCase<CalculateGradeUseCaseInput, GradeResponseDTO> {
  constructor(
    @inject(GradeRepository) private gradeRepository: GradeRepository,
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository
  ) {}

  async execute(input: CalculateGradeUseCaseInput): Promise<GradeResponseDTO> {
    const { studentId, questionListId } = input;

    logger.info('[CalculateGradeUseCase] Calculating grade', { studentId, questionListId });

    // 1. Find list with questions
    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true, false);
    if (!questionList) {
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    // 2. Check if list has questions
    if (!questionList.hasQuestions()) {
      logger.warn('[CalculateGradeUseCase] List without questions', { questionListId });
      return this.createOrUpdateGrade(studentId, questionListId, 0);
    }

    // 3. Find all student submissions for list questions
    const questionIds = questionList.questions!.map(q => q.id);
    const allSubmissions = await Promise.all(
      questionIds.map(questionId => 
        this.submissionRepository.findByUserAndQuestion(studentId, questionId)
      )
    );

    // 4. Calculate score
    let totalScore = 0;

    if (questionList.usesGroupScoring()) {
      // Group system: best submission per group
      const groups = new Map<string, number>();
      
      questionList.questions!.forEach((question, index) => {
        const submissions = allSubmissions[index];
        const bestScore = this.getBestScore(submissions);
        const group = questionList.getQuestionGroup(question.id);
        
        if (group) {
          const groupId = group.id;
          const currentGroupScore = groups.get(groupId) || 0;
          groups.set(groupId, Math.max(currentGroupScore, bestScore));
        } else {
          totalScore += bestScore;
        }
      });

      // Sum group scores
      groups.forEach(score => {
        totalScore += score;
      });
    } else {
      // Simple system: sum of all submissions
      allSubmissions.forEach(submissions => {
        totalScore += this.getBestScore(submissions);
      });
    }

    // 5. Normalize score to 0-100
    const maxScore = questionList.calculateMaxPossibleScore();
    const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    logger.info('[CalculateGradeUseCase] Grade calculated', { 
      studentId, 
      questionListId, 
      normalizedScore,
      totalScore,
      maxScore
    });

    // 6. Create or update grade
    return this.createOrUpdateGrade(studentId, questionListId, normalizedScore);
  }

  /**
   * Gets the best score from an array of submissions
   */
  private getBestScore(submissions: any[]): number {
    if (!submissions || submissions.length === 0) return 0;
    return Math.max(...submissions.map(s => s.score || 0));
  }

  /**
   * Creates or updates grade in database
   */
  private async createOrUpdateGrade(
    studentId: string,
    questionListId: string,
    score: number
  ): Promise<GradeResponseDTO> {
    // Find existing grade
    let grade = await this.gradeRepository.findByStudentAndList(studentId, questionListId);

    if (grade) {
      // Update existing grade using domain method
      grade.updateScore(score);
      await this.gradeRepository.update(grade.id, { score });
      grade = await this.gradeRepository.findById(grade.id);
    } else {
      // Create new grade
      grade = new Grade();
      grade.studentId = studentId;
      grade.questionListId = questionListId;
      grade.score = score;
      grade = await this.gradeRepository.create(grade);
    }

    return GradeMapper.toDetailDTO(grade!);
  }
}
