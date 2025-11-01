import { BaseRepository } from './BaseRepository';
import { Class } from '../models/Class';
import { User } from '../models/User';

/**
 * Repositório de turmas
 */
export class ClassRepository extends BaseRepository<Class> {
  constructor() {
    super(Class);
  }

  /**
   * Busca turma por ID com relações
   */
  async findByIdWithRelations(id: string, includeStudents: boolean = false, includeProfessor: boolean = false): Promise<Class | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('class')
      .where('class.id = :id', { id });

    if (includeProfessor) {
      queryBuilder.leftJoinAndSelect('class.professor', 'professor');
    }

    if (includeStudents) {
      queryBuilder.leftJoinAndSelect('class.students', 'students');
    }

    return queryBuilder.getOne();
  }

  /**
   * Busca todas as turmas com relações
   */
  async findAllWithRelations(includeStudents: boolean = false, includeProfessor: boolean = false): Promise<Class[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('class')
      .orderBy('class.createdAt', 'DESC');

    if (includeProfessor) {
      queryBuilder.leftJoinAndSelect('class.professor', 'professor');
    }

    if (includeStudents) {
      queryBuilder.leftJoinAndSelect('class.students', 'students');
    }

    return queryBuilder.getMany();
  }

  /**
   * Busca turmas de um professor
   */
  async findByProfessor(professorId: string): Promise<Class[]> {
    return this.repository.find({
      where: { professorId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca turmas de um estudante
   */
  async findByStudent(studentId: string): Promise<Class[]> {
    return this.repository
      .createQueryBuilder('class')
      .innerJoin('class.students', 'student', 'student.id = :studentId', { studentId })
      .orderBy('class.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Adiciona estudante à turma
   */
  async addStudent(classId: string, student: User): Promise<void> {
    const classEntity = await this.findByIdWithRelations(classId, true);
    if (!classEntity) {
      throw new Error('Turma não encontrada');
    }

    if (!classEntity.students) {
      classEntity.students = [];
    }

    // Verifica se estudante já está na turma
    const isAlreadyEnrolled = classEntity.students.some(s => s.id === student.id);
    if (!isAlreadyEnrolled) {
      classEntity.students.push(student);
      await this.repository.save(classEntity);
    }
  }

  /**
   * Remove estudante da turma
   */
  async removeStudent(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.findByIdWithRelations(classId, true);
    if (!classEntity) {
      throw new Error('Turma não encontrada');
    }

    if (classEntity.students) {
      classEntity.students = classEntity.students.filter(s => s.id !== studentId);
      await this.repository.save(classEntity);
    }
  }

  /**
   * Busca estudantes de uma turma
   */
  async findStudents(classId: string): Promise<User[]> {
    const classEntity = await this.findByIdWithRelations(classId, true);
    return classEntity?.students || [];
  }

  /**
   * Verifica se um estudante está matriculado em uma turma
   */
  async isStudentEnrolled(classId: string, studentId: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder('class')
      .innerJoin('class.students', 'student', 'student.id = :studentId', { studentId })
      .where('class.id = :classId', { classId })
      .getCount();

    return result > 0;
  }
}


