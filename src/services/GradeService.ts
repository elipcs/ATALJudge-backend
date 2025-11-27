/**
 * @module services/GradeService
 * @description Service for managing and calculating student grades.
 * 
 * This service handles:
 * - Retrieving grades (by ID, student, list)
 * - Calculating grades based on submission scores
 * - Upserting grades (create or update)
 * - Recalculating and updating grades
 * - Supports simple and group-based scoring modes
 * 
 * @example
 * const gradeService = container.resolve(GradeService);
 * const grade = await gradeService.getGradeById(gradeId);
 * const calculated = await gradeService.recalculateAndUpsertGrade(studentId, listId);
 */

import { injectable, inject } from 'tsyringe';
import { GradeRepository, UserRepository, QuestionListRepository, SubmissionRepository } from '../repositories';
import { CreateGradeDTO, UpdateGradeDTO, GradeResponseDTO } from '../dtos';
import { NotFoundError, InternalServerError, logger } from '../utils';

/**
 * Service for grade management and calculation.
 * 
 * @class GradeService
 */
@injectable()
export class GradeService {
  constructor(
    @inject(GradeRepository) private gradeRepository: GradeRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository
  ) {}

  /**
   * Gets a grade by ID.
   * 
   * @async
   * @param {string} id - The grade ID
   * @returns {Promise<GradeResponseDTO>} Grade data
   * @throws {NotFoundError} If grade not found
   */
  async getGradeById(id: string): Promise<GradeResponseDTO> {
    const grade = await this.gradeRepository.findById(id);
    
    if (!grade) {
      throw new NotFoundError('Grade not found', 'GRADE_NOT_FOUND');
    }
    
    return new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      questionListId: grade.questionListId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      studentName: grade.student?.name,
      questionListTitle: grade.questionList?.title
    });
  }

  async getGradeByStudentAndList(studentId: string, questionListId: string): Promise<GradeResponseDTO | null> {
    const grade = await this.gradeRepository.findByStudentAndList(studentId, questionListId);
    
    if (!grade) {
      return null;
    }
    
    return new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      questionListId: grade.questionListId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      studentName: grade.student?.name,
      questionListTitle: grade.questionList?.title
    });
  }

  async getGradesByStudent(studentId: string): Promise<GradeResponseDTO[]> {
    const grades = await this.gradeRepository.findByStudent(studentId);
    
    return grades.map(grade => new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      questionListId: grade.questionListId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      questionListTitle: grade.questionList?.title
    }));
  }

  async getGradesByList(questionListId: string): Promise<GradeResponseDTO[]> {
    const grades = await this.gradeRepository.findByList(questionListId);
    
    return grades.map(grade => new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      questionListId: grade.questionListId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      studentName: grade.student?.name
    }));
  }


  /**
   * Calculates the grade for a student in a question list.
   * 
   * Supports two scoring modes:
   * - simple: Takes top N best scores and averages them
   * - groups: Groups questions and calculates weighted average
   * 
   * @async
   * @param {string} studentId - The student ID
   * @param {string} questionListId - The question list ID
   * @returns {Promise<number>} Calculated final score
   * @throws {NotFoundError} If list not found
   */
  async calculateGradeForList(studentId: string, questionListId: string): Promise<number> {
    logger.info('Calculating student grade', { studentId, questionListId });

    const questionList = await this.questionListRepository.findByIdWithRelations(questionListId, true, false);
    if (!questionList) {
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    if (!questionList.questions || questionList.questions.length === 0) {
      logger.warn('List without questions', { questionListId });
      return 0;
    }

    const questionIds = questionList.questions.map(q => q.id);
    
    const allSubmissions = await Promise.all(
      questionIds.map(questionId => 
        this.submissionRepository.findByUserAndQuestion(studentId, questionId)
      )
    );

    const bestScoresByQuestion = new Map<string, number>();
    
    allSubmissions.flat().forEach(submission => {
      const currentBest = bestScoresByQuestion.get(submission.questionId) || 0;
      if (submission.score > currentBest) {
        bestScoresByQuestion.set(submission.questionId, submission.score);
      }
    });

    logger.debug('Best scores per question', { 
      studentId, 
      questionListId, 
      bestScores: Array.from(bestScoresByQuestion.entries()) 
    });

    let finalScore = 0;

    if (questionList.scoringMode === 'simple') {
      const n = questionList.minQuestionsForMaxScore || questionList.questions.length;
      const scores = Array.from(bestScoresByQuestion.values()).sort((a, b) => b - a);
      const topNScores = scores.slice(0, n);
      
      if (topNScores.length > 0) {
        const averageScore = topNScores.reduce((sum, score) => sum + score, 0) / topNScores.length;
        finalScore = Math.round((averageScore / 100) * questionList.maxScore);
      }

      logger.info('Grade calculated (simple mode)', {
        studentId,
        questionListId,
        n,
        topNScores,
        averageScore: topNScores.length > 0 ? topNScores.reduce((sum, score) => sum + score, 0) / topNScores.length : 0,
        finalScore,
        maxScore: questionList.maxScore
      });

    } else if (questionList.scoringMode === 'groups') {
      if (!questionList.questionGroups || questionList.questionGroups.length === 0) {
        logger.warn('List in groups mode but without defined groups', { questionListId });
        return 0;
      }

      let totalWeightedScore = 0;
      let totalWeight = 0;

      questionList.questionGroups.forEach(group => {
        const groupQuestionIds = group.questionIds || [];
        const groupScores: number[] = [];

        groupQuestionIds.forEach(questionId => {
          const score = bestScoresByQuestion.get(questionId);
          if (score !== undefined) {
            groupScores.push(score);
          }
        });

        if (groupScores.length > 0) {
          const bestGroupScore = Math.max(...groupScores);
          const groupWeight = group.weight || 1;
          totalWeightedScore += bestGroupScore * groupWeight;
          totalWeight += groupWeight;

          logger.debug('Group score', {
            studentId,
            questionListId,
            groupName: group.name,
            groupScores,
            bestGroupScore,
            groupWeight
          });
        }
      });

      if (totalWeight > 0) {
        const averageScore = totalWeightedScore / totalWeight;
        finalScore = Math.round((averageScore / 100) * questionList.maxScore);
      }

      logger.info('Grade calculated (groups mode)', {
        studentId,
        questionListId,
        totalWeightedScore,
        totalWeight,
        finalScore,
        maxScore: questionList.maxScore
      });
    }

    return finalScore;
  }

  /**
   * Creates or updates a grade (upsert operation).
   * 
   * @async
   * @param {CreateGradeDTO} data - Grade data (studentId, questionListId, score)
   * @returns {Promise<GradeResponseDTO>} Created or updated grade
   * @throws {NotFoundError} If student or list not found
   * @throws {InternalServerError} If update fails
   */
  async upsertGrade(data: CreateGradeDTO): Promise<GradeResponseDTO> {
    
    const student = await this.userRepository.findById(data.studentId);
    
    if (!student) {
      throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    }

    const questionList = await this.questionListRepository.findById(data.questionListId);
    
    if (!questionList) {
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    const existingGrade = await this.gradeRepository.findByStudentAndList(data.studentId, data.questionListId);
    
    if (existingGrade) {
      
      const updated = await this.gradeRepository.update(existingGrade.id, {
        score: data.score
      });

      if (!updated) {
        throw new InternalServerError('Error updating grade', 'UPDATE_ERROR');
      }

      return new GradeResponseDTO({
        id: updated.id,
        studentId: updated.studentId,
        questionListId: updated.questionListId,
        score: updated.score,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        studentName: student.name,
        questionListTitle: questionList.title
      });
    }

    const grade = await this.gradeRepository.create({
      studentId: data.studentId,
      questionListId: data.questionListId,
      score: data.score
    });
    
    return new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      questionListId: grade.questionListId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      studentName: student.name,
      questionListTitle: questionList.title
    });
  }


  /**
   * Recalculates and updates a student's grade.
   * 
   * @async
   * @param {string} studentId - The student ID
   * @param {string} questionListId - The question list ID
   * @returns {Promise<GradeResponseDTO>} Updated grade after recalculation
   * @throws {NotFoundError} If student or list not found
   */
  async recalculateAndUpsertGrade(studentId: string, questionListId: string): Promise<GradeResponseDTO> {
    logger.info('Recalculating student grade', { studentId, questionListId });

    const student = await this.userRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    }

    const questionList = await this.questionListRepository.findById(questionListId);
    if (!questionList) {
      throw new NotFoundError('List not found', 'LIST_NOT_FOUND');
    }

    const calculatedScore = await this.calculateGradeForList(studentId, questionListId);

    logger.info('Grade recalculated', { studentId, questionListId, calculatedScore });

    return this.upsertGrade({
      studentId,
      questionListId,
      score: calculatedScore
    });
  }

  /**
   * Updates a grade by ID.
   * 
   * @async
   * @param {string} id - The grade ID
   * @param {UpdateGradeDTO} data - Updated grade data (score)
   * @returns {Promise<GradeResponseDTO>} Updated grade
   * @throws {NotFoundError} If grade not found
   * @throws {InternalServerError} If update fails
   */
  async updateGrade(id: string, data: UpdateGradeDTO): Promise<GradeResponseDTO> {
    const grade = await this.gradeRepository.findById(id);
    
    if (!grade) {
      throw new NotFoundError('Grade not found', 'GRADE_NOT_FOUND');
    }
    
    const updated = await this.gradeRepository.update(id, {
      score: data.score
    });

    if (!updated) {
      throw new InternalServerError('Error updating grade', 'UPDATE_ERROR');
    }
    
    return new GradeResponseDTO({
      id: updated.id,
      studentId: updated.studentId,
      questionListId: updated.questionListId,
      score: updated.score,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      studentName: updated.student?.name,
      questionListTitle: updated.questionList?.title
    });
  }

  /**
   * Deletes a grade by ID.
   * 
   * @async
   * @param {string} id - The grade ID
   * @returns {Promise<void>}
   * @throws {NotFoundError} If grade not found
   */
  async deleteGrade(id: string): Promise<void> {
    const grade = await this.gradeRepository.findById(id);
    
    if (!grade) {
      throw new NotFoundError('Grade not found', 'GRADE_NOT_FOUND');
    }
    
    await this.gradeRepository.delete(id);
  }

  /**
   * Deletes all grades for a student.
   * 
   * @async
   * @param {string} studentId - The student ID
   * @returns {Promise<void>}
   */
  async deleteGradesByStudent(studentId: string): Promise<void> {
    await this.gradeRepository.deleteByStudent(studentId);
  }

  /**
   * Deletes all grades for a question list.
   * 
   * @async
   * @param {string} questionListId - The question list ID
   * @returns {Promise<void>}
   */
  async deleteGradesByList(questionListId: string): Promise<void> {
    await this.gradeRepository.deleteByList(questionListId);
  }
}

