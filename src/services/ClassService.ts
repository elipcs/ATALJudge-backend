/**
 * @module services/ClassService
 * @description Service to manage classes in the system.
 * Provides operations to create, update, delete and retrieve classes,
 * as well as manage students and teachers within a class.
 * @class ClassService
 */
import { injectable, inject } from 'tsyringe';
import { CreateClassDTO, ClassResponseDTO } from '../dtos';
import { UserRole } from '../enums';
import { logger, NotFoundError, ForbiddenError, ValidationError } from '../utils';
import { ClassRepository, UserRepository } from '../repositories';
import { Class } from '../models/Class';

@injectable()
export class ClassService {
  constructor(
    @inject(ClassRepository) private classRepository: ClassRepository,
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async getAllClasses(includeRelations: boolean = false): Promise<ClassResponseDTO[]> {
    const queryBuilder = this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.professor', 'professor')
      .orderBy('class.createdAt', 'DESC');

    if (includeRelations) {
      queryBuilder
        .leftJoinAndSelect('class.students', 'students')
        .leftJoinAndSelect('students.grades', 'grades');
    }

    const classes = await queryBuilder.getMany();

    return classes.map(classEntity => this.toResponseDTO(classEntity, includeRelations));
  }

  async getClassById(id: string, includeRelations: boolean = false): Promise<ClassResponseDTO> {
    const queryBuilder = this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.professor', 'professor')
      .where('class.id = :id', { id });

    if (includeRelations) {
      queryBuilder
        .leftJoinAndSelect('class.students', 'students')
        .leftJoinAndSelect('students.grades', 'grades');
    }

    const classEntity = await queryBuilder.getOne();

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    return this.toResponseDTO(classEntity, includeRelations);
  }

  async createClass(data: CreateClassDTO, professorId?: string): Promise<ClassResponseDTO> {
    logger.debug('[SERVICE] Criando turma', { name: data.name, professorId });

    if (!professorId) {
      logger.error('[SERVICE] Professor não especificado');
      throw new ValidationError('Professor não especificado', 'PROFESSOR_REQUIRED');
    }

    logger.debug('[SERVICE] Buscando professor', { professorId });
    const professor = await this.userRepository.findById(professorId);

    if (!professor) {
      logger.error('[SERVICE] Professor não encontrado', { professorId });
      throw new NotFoundError('Professor não encontrado', 'PROFESSOR_NOT_FOUND');
    }

    logger.debug('[SERVICE] Professor encontrado', { id: professor.id, role: professor.role });
    
    if (professor.role !== UserRole.PROFESSOR && professor.role !== UserRole.ASSISTANT) {
      logger.error('[SERVICE] Usuário não é professor/assistente', { role: professor.role });
      throw new ForbiddenError('Apenas professores podem criar turmas', 'INVALID_ROLE');
    }

    logger.debug('[SERVICE] Criando entidade de turma', { name: data.name, professorId });

    const classEntity = await this.classRepository.create({
      name: data.name,
      professorId: professorId,
    });
    
    logger.debug('[SERVICE] Entidade criada', { id: classEntity.id, name: classEntity.name, professorId: classEntity.professorId });

    logger.info('[SERVICE] Turma salva com sucesso', { classId: classEntity.id });
    return this.toResponseDTO(classEntity, false);
  }

  async updateClass(id: string, data: CreateClassDTO, userId?: string): Promise<ClassResponseDTO> {
    const classEntity = await this.classRepository.findById(id);

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    if (userId && classEntity.professorId !== userId) {
      const user = await this.userRepository.findById(userId);
      if (user?.role !== UserRole.PROFESSOR) {
        throw new ForbiddenError('Sem permissão para atualizar esta turma', 'NO_PERMISSION');
      }
    }

    const updated = await this.classRepository.update(id, { name: data.name });
    
    if (!updated) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    return this.toResponseDTO(updated, false);
  }

  async deleteClass(id: string, userId?: string): Promise<void> {
    const classEntity = await this.classRepository.findById(id);

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    if (userId && classEntity.professorId !== userId) {
      const user = await this.userRepository.findById(userId);
      if (user?.role !== UserRole.PROFESSOR) {
        throw new ForbiddenError('Sem permissão para deletar esta turma', 'NO_PERMISSION');
      }
    }

    await this.classRepository.delete(id);
  }

  async getClassStudents(classId: string): Promise<any[]> {
    const students = await this.classRepository.findStudents(classId);

    return students.map(student => {
      const studentData: any = {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt.toISOString()
      };

      if ('studentRegistration' in student) {
        studentData.studentRegistration = (student as any).studentRegistration;
      }

      if ('grades' in student && Array.isArray((student as any).grades)) {
        studentData.grades = (student as any).grades.map((grade: any) => ({
          id: grade.id,
          questionListId: grade.questionListId,
          score: grade.score,
          createdAt: grade.createdAt.toISOString(),
          updatedAt: grade.updatedAt.toISOString()
        }));
      }

      return studentData;
    });
  }

  async addStudentToClass(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.classRepository.findById(classId);

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    const student = await this.userRepository.findById(studentId);

    if (!student) {
      throw new NotFoundError('Estudante não encontrado', 'STUDENT_NOT_FOUND');
    }

    if (student.role !== UserRole.STUDENT) {
      throw new ValidationError('Usuário não é um estudante', 'INVALID_STUDENT_ROLE');
    }

    const alreadyEnrolled = await this.classRepository.isStudentEnrolled(classId, studentId);
    if (alreadyEnrolled) {
      throw new ValidationError('Estudante já está matriculado nesta turma', 'ALREADY_ENROLLED');
    }

    await this.classRepository.addStudent(classId, studentId);
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.classRepository.findById(classId);

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    await this.classRepository.removeStudent(classId, studentId);
  }

  private toResponseDTO(classEntity: Class, includeRelations: boolean): ClassResponseDTO {
    const dto: Partial<ClassResponseDTO> = {
      id: classEntity.id,
      name: classEntity.name,
      professorId: classEntity.professorId,
      createdAt: classEntity.createdAt,
      updatedAt: classEntity.updatedAt
    };

    if (classEntity.professor) {
      dto.professorName = classEntity.professor.name;
    }

    if (classEntity.students) {
      dto.studentIds = classEntity.students.map(s => s.id);
      dto.studentCount = classEntity.students.length;
    }

    if (includeRelations) {
      if (classEntity.professor) {
        dto.professor = {
          id: classEntity.professor.id,
          name: classEntity.professor.name,
          email: classEntity.professor.email,
          role: classEntity.professor.role
        };
      }

      if (classEntity.students) {
        dto.students = classEntity.students.map(student => {
          const studentData: any = {
            id: student.id,
            name: student.name,
            email: student.email,
            role: student.role,
            createdAt: student.createdAt.toISOString()
          };

          if ('studentRegistration' in student) {
            studentData.studentRegistration = (student as { studentRegistration?: string }).studentRegistration;
          }

          if ('grades' in student && Array.isArray((student as any).grades)) {
            studentData.grades = (student as any).grades.map((grade: any) => ({
              id: grade.id,
              questionListId: grade.questionListId,
              score: grade.score,
              createdAt: grade.createdAt.toISOString(),
              updatedAt: grade.updatedAt.toISOString()
            }));
          }
          
          return studentData;
        });
      }
    }

    return new ClassResponseDTO(dto);
  }
}

