import { injectable, inject } from 'tsyringe';
import { GradeRepository, UserRepository, QuestionListRepository, SubmissionRepository } from '../repositories';
import { CreateGradeDTO, UpdateGradeDTO, GradeResponseDTO } from '../dtos';
import { NotFoundError, InternalServerError, logger } from '../utils';

@injectable()
export class GradeService {
  constructor(
    @inject(GradeRepository) private gradeRepository: GradeRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(QuestionListRepository) private listRepository: QuestionListRepository,
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository
  ) {}

  async getGradeById(id: string): Promise<GradeResponseDTO> {
    const grade = await this.gradeRepository.findById(id);
    
    if (!grade) {
      throw new NotFoundError('Nota não encontrada', 'GRADE_NOT_FOUND');
    }
    
    return new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      listId: grade.listId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      studentName: grade.student?.name,
      listTitle: grade.list?.title
    });
  }

  async getGradeByStudentAndList(studentId: string, listId: string): Promise<GradeResponseDTO | null> {
    const grade = await this.gradeRepository.findByStudentAndList(studentId, listId);
    
    if (!grade) {
      return null;
    }
    
    return new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      listId: grade.listId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      studentName: grade.student?.name,
      listTitle: grade.list?.title
    });
  }

  async getGradesByStudent(studentId: string): Promise<GradeResponseDTO[]> {
    const grades = await this.gradeRepository.findByStudent(studentId);
    
    return grades.map(grade => new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      listId: grade.listId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      listTitle: grade.list?.title
    }));
  }

  async getGradesByList(listId: string): Promise<GradeResponseDTO[]> {
    const grades = await this.gradeRepository.findByList(listId);
    
    return grades.map(grade => new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      listId: grade.listId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      studentName: grade.student?.name
    }));
  }


  async calculateGradeForList(studentId: string, listId: string): Promise<number> {
    logger.info('Calculando nota do aluno', { studentId, listId });

    const list = await this.listRepository.findByIdWithRelations(listId, true, false, false);
    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    if (!list.questions || list.questions.length === 0) {
      logger.warn('Lista sem questões', { listId });
      return 0;
    }

    const questionIds = list.questions.map(q => q.id);
    
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

    logger.debug('Melhores scores por questão', { 
      studentId, 
      listId, 
      bestScores: Array.from(bestScoresByQuestion.entries()) 
    });

    let finalScore = 0;

    if (list.scoringMode === 'simple') {
      const n = list.minQuestionsForMaxScore || list.questions.length;
      const scores = Array.from(bestScoresByQuestion.values()).sort((a, b) => b - a);
      const topNScores = scores.slice(0, n);
      
      if (topNScores.length > 0) {
        const averageScore = topNScores.reduce((sum, score) => sum + score, 0) / topNScores.length;
        finalScore = Math.round((averageScore / 100) * list.maxScore);
      }

      logger.info('Nota calculada (modo simple)', {
        studentId,
        listId,
        n,
        topNScores,
        averageScore: topNScores.length > 0 ? topNScores.reduce((sum, score) => sum + score, 0) / topNScores.length : 0,
        finalScore,
        maxScore: list.maxScore
      });

    } else if (list.scoringMode === 'groups') {
      if (!list.questionGroups || list.questionGroups.length === 0) {
        logger.warn('Lista em modo groups mas sem grupos definidos', { listId });
        return 0;
      }

      let totalWeightedScore = 0;
      let totalWeight = 0;

      list.questionGroups.forEach(group => {
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

          logger.debug('Score do grupo', {
            studentId,
            listId,
            groupName: group.name,
            groupScores,
            bestGroupScore,
            groupWeight
          });
        }
      });

      if (totalWeight > 0) {
        const averageScore = totalWeightedScore / totalWeight;
        finalScore = Math.round((averageScore / 100) * list.maxScore);
      }

      logger.info('Nota calculada (modo groups)', {
        studentId,
        listId,
        totalWeightedScore,
        totalWeight,
        finalScore,
        maxScore: list.maxScore
      });
    }

    return finalScore;
  }

  async upsertGrade(data: CreateGradeDTO): Promise<GradeResponseDTO> {
    
    const student = await this.userRepository.findById(data.studentId);
    
    if (!student) {
      throw new NotFoundError('Estudante não encontrado', 'STUDENT_NOT_FOUND');
    }

    const list = await this.listRepository.findById(data.listId);
    
    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const existingGrade = await this.gradeRepository.findByStudentAndList(data.studentId, data.listId);
    
    if (existingGrade) {
      
      const updated = await this.gradeRepository.update(existingGrade.id, {
        score: data.score
      });

      if (!updated) {
        throw new InternalServerError('Erro ao atualizar nota', 'UPDATE_ERROR');
      }

      return new GradeResponseDTO({
        id: updated.id,
        studentId: updated.studentId,
        listId: updated.listId,
        score: updated.score,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        studentName: student.name,
        listTitle: list.title
      });
    }

    const grade = await this.gradeRepository.create({
      studentId: data.studentId,
      listId: data.listId,
      score: data.score
    });
    
    return new GradeResponseDTO({
      id: grade.id,
      studentId: grade.studentId,
      listId: grade.listId,
      score: grade.score,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
      studentName: student.name,
      listTitle: list.title
    });
  }


  async recalculateAndUpsertGrade(studentId: string, listId: string): Promise<GradeResponseDTO> {
    logger.info('Recalculando nota do aluno', { studentId, listId });

    const student = await this.userRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudante não encontrado', 'STUDENT_NOT_FOUND');
    }

    const list = await this.listRepository.findById(listId);
    if (!list) {
      throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
    }

    const calculatedScore = await this.calculateGradeForList(studentId, listId);

    logger.info('Nota recalculada', { studentId, listId, calculatedScore });

    return this.upsertGrade({
      studentId,
      listId,
      score: calculatedScore
    });
  }

  async updateGrade(id: string, data: UpdateGradeDTO): Promise<GradeResponseDTO> {
    const grade = await this.gradeRepository.findById(id);
    
    if (!grade) {
      throw new NotFoundError('Nota não encontrada', 'GRADE_NOT_FOUND');
    }
    
    const updated = await this.gradeRepository.update(id, {
      score: data.score
    });

    if (!updated) {
      throw new InternalServerError('Erro ao atualizar nota', 'UPDATE_ERROR');
    }
    
    return new GradeResponseDTO({
      id: updated.id,
      studentId: updated.studentId,
      listId: updated.listId,
      score: updated.score,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      studentName: updated.student?.name,
      listTitle: updated.list?.title
    });
  }

  async deleteGrade(id: string): Promise<void> {
    const grade = await this.gradeRepository.findById(id);
    
    if (!grade) {
      throw new NotFoundError('Nota não encontrada', 'GRADE_NOT_FOUND');
    }
    
    await this.gradeRepository.delete(id);
  }

  async deleteGradesByStudent(studentId: string): Promise<void> {
    await this.gradeRepository.deleteByStudent(studentId);
  }

  async deleteGradesByList(listId: string): Promise<void> {
    await this.gradeRepository.deleteByList(listId);
  }
}

