import { CreateClassDTO, ClassResponseDTO } from '../dtos';
import { UserRole } from '../enums';
import { logger, NotFoundError, ForbiddenError, ValidationError } from '../utils';
import { ClassRepository, UserRepository } from '../repositories';
import { Class } from '../models/Class';

/**
 * Service para gerenciamento de turmas
 */
export class ClassService {
  private classRepository: ClassRepository;
  private userRepository: UserRepository;

  constructor(
    classRepository: ClassRepository,
    userRepository: UserRepository
  ) {
    this.classRepository = classRepository;
    this.userRepository = userRepository;
  }

  /**
   * Lista todas as turmas
   */
  async getAllClasses(includeRelations: boolean = false): Promise<ClassResponseDTO[]> {
    const queryBuilder = this.classRepository
      .getRepository()
      .createQueryBuilder('class')
      .orderBy('class.createdAt', 'DESC');

    if (includeRelations) {
      queryBuilder
        .leftJoinAndSelect('class.professor', 'professor')
        .leftJoinAndSelect('class.students', 'students');
    }

    const classes = await queryBuilder.getMany();

    return classes.map(classEntity => this.toResponseDTO(classEntity, includeRelations));
  }

  /**
   * Busca turma por ID
   */
  async getClassById(id: string, includeRelations: boolean = false): Promise<ClassResponseDTO> {
    const queryBuilder = this.classRepository
      .getRepository()
      .createQueryBuilder('class')
      .where('class.id = :id', { id });

    if (includeRelations) {
      queryBuilder
        .leftJoinAndSelect('class.professor', 'professor')
        .leftJoinAndSelect('class.students', 'students');
    }

    const classEntity = await queryBuilder.getOne();

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    return this.toResponseDTO(classEntity, includeRelations);
  }

  /**
   * Cria uma nova turma
   */
  async createClass(data: CreateClassDTO, professorId?: string): Promise<ClassResponseDTO> {
    logger.debug('[SERVICE] Criando turma', { name: data.name, professorId });
    
    // Validar professor
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
    
    // Criar turma
    const classEntity = await this.classRepository.create({
      name: data.name,
      professorId: professorId,
    });
    
    logger.debug('[SERVICE] Entidade criada', { id: classEntity.id, name: classEntity.name, professorId: classEntity.professorId });

    logger.info('[SERVICE] Turma salva com sucesso', { classId: classEntity.id });
    return this.toResponseDTO(classEntity, false);
  }

  /**
   * Atualiza uma turma
   */
  async updateClass(id: string, data: CreateClassDTO, userId?: string): Promise<ClassResponseDTO> {
    const classEntity = await this.classRepository.findById(id);

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    // Verificar permissão
    if (userId && classEntity.professorId !== userId) {
      const user = await this.userRepository.findById(userId);
      if (user?.role !== UserRole.PROFESSOR) {
        throw new ForbiddenError('Sem permissão para atualizar esta turma', 'NO_PERMISSION');
      }
    }

    // Atualizar
    const updated = await this.classRepository.update(id, { name: data.name });
    
    if (!updated) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    return this.toResponseDTO(updated, false);
  }

  /**
   * Deleta uma turma
   */
  async deleteClass(id: string, userId?: string): Promise<void> {
    const classEntity = await this.classRepository.findById(id);

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    // Verificar permissão
    if (userId && classEntity.professorId !== userId) {
      const user = await this.userRepository.findById(userId);
      if (user?.role !== UserRole.PROFESSOR) {
        throw new ForbiddenError('Sem permissão para deletar esta turma', 'NO_PERMISSION');
      }
    }

    await this.classRepository.delete(id);
  }

  /**
   * Lista alunos de uma turma
   */
  async getClassStudents(classId: string): Promise<any[]> {
    const students = await this.classRepository.findStudents(classId);

    return students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      createdAt: student.createdAt.toISOString()
    }));
  }

  /**
   * Adiciona aluno à turma
   */
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

    // Verificar se já está na turma
    const alreadyEnrolled = await this.classRepository.isStudentEnrolled(classId, studentId);
    if (alreadyEnrolled) {
      throw new ValidationError('Estudante já está matriculado nesta turma', 'ALREADY_ENROLLED');
    }

    await this.classRepository.addStudent(classId, student);
  }

  /**
   * Remove aluno da turma
   */
  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.classRepository.findById(classId);

    if (!classEntity) {
      throw new NotFoundError('Turma não encontrada', 'CLASS_NOT_FOUND');
    }

    await this.classRepository.removeStudent(classId, studentId);
  }

  /**
   * Converte entidade para DTO de resposta
   */
  private toResponseDTO(classEntity: Class, includeRelations: boolean): ClassResponseDTO {
    const dto: Partial<ClassResponseDTO> = {
      id: classEntity.id,
      name: classEntity.name,
      professorId: classEntity.professorId,
      createdAt: classEntity.createdAt,
      updatedAt: classEntity.updatedAt
    };

    // Sempre incluir IDs e contagem de estudantes se disponível
    if (classEntity.students) {
      dto.studentIds = classEntity.students.map(s => s.id);
      dto.studentCount = classEntity.students.length;
    }

    // Incluir objetos completos apenas se solicitado
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
          
          // Adicionar studentRegistration se existir (campo específico de Student)
          if ('studentRegistration' in student) {
            studentData.studentRegistration = (student as { studentRegistration?: string }).studentRegistration;
          }
          
          return studentData;
        });
      }
    }

    return new ClassResponseDTO(dto);
  }
}


