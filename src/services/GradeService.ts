import { GradeRepository, UserRepository, QuestionListRepository } from '../repositories';
import { CreateGradeDTO, UpdateGradeDTO, GradeResponseDTO } from '../dtos';
import { NotFoundError, InternalServerError } from '../utils';

export class GradeService {
  private gradeRepository: GradeRepository;
  private userRepository: UserRepository;
  private listRepository: QuestionListRepository;

  constructor(
    gradeRepository: GradeRepository,
    userRepository: UserRepository,
    listRepository: QuestionListRepository
  ) {
    this.gradeRepository = gradeRepository;
    this.userRepository = userRepository;
    this.listRepository = listRepository;
  }

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

