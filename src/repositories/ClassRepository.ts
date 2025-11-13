import { injectable } from 'tsyringe';
import { In } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Class } from '../models/Class';
import { User } from '../models/User';

@injectable()
export class ClassRepository extends BaseRepository<Class> {
  constructor() {
    super(Class);
  }

  // Override findAll to always include professor relation
  async findAll(): Promise<Class[]> {
    return this.repository.find({
      relations: ['professor'],
      order: { createdAt: 'DESC' }
    });
  }

  // Override findById to always include professor relation
  async findById(id: string): Promise<Class | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['professor']
    });
  }

  async findByIdWithRelations(id: string, includeStudents: boolean = false, includeProfessor: boolean = false): Promise<Class | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('class')
      .where('class.id = :id', { id });

    if (includeProfessor) {
      queryBuilder.leftJoinAndSelect('class.professor', 'professor');
    }

    if (includeStudents) {
      queryBuilder
        .leftJoinAndSelect('class.students', 'students')
        .leftJoinAndSelect('students.grades', 'grades');
    }

    return queryBuilder.getOne();
  }

  async findAllWithRelations(includeStudents: boolean = false, includeProfessor: boolean = false): Promise<Class[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('class')
      .orderBy('class.createdAt', 'DESC');

    if (includeProfessor) {
      queryBuilder.leftJoinAndSelect('class.professor', 'professor');
    }

    if (includeStudents) {
      queryBuilder
        .leftJoinAndSelect('class.students', 'students')
        .leftJoinAndSelect('students.grades', 'grades');
    }

    return queryBuilder.getMany();
  }

  async findByIds(classIds: string[]): Promise<Class[]> {
    return this.repository.findBy({ id: In(classIds) });
  }

  async findByProfessor(professorId: string): Promise<Class[]> {
    return this.repository.find({
      where: { professorId },
      relations: ['students', 'students.grades'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStudent(studentId: string): Promise<Class[]> {
    return this.repository
      .createQueryBuilder('class')
      .innerJoin('class.students', 'student', 'student.id = :studentId', { studentId })
      .leftJoinAndSelect('class.students', 'students')
      .leftJoinAndSelect('students.grades', 'grades')
      .orderBy('class.createdAt', 'DESC')
      .getMany();
  }

  createQueryBuilder(alias: string) {
    return this.repository.createQueryBuilder(alias);
  }

  async addStudent(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.repository.findOne({ where: { id: classId } });
    if (!classEntity) {
      throw new Error('Turma não encontrada');
    }

    const connection = this.repository.manager.connection;
    await connection.query(
      'UPDATE users SET class_id = $1 WHERE id = $2',
      [classId, studentId]
    );
  }

  async removeStudent(classId: string, studentId: string): Promise<void> {
    const classEntity = await this.repository.findOne({ where: { id: classId } });
    if (!classEntity) {
      throw new Error('Turma não encontrada');
    }

    const userRepository = this.repository.manager.getRepository('User');
    await userRepository.update(
      { id: studentId, classId: classId },
      { classId: null }
    );
  }

  async findStudents(classId: string): Promise<User[]> {
    const userRepository = this.repository.manager.getRepository<User>('User');
    return userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.grades', 'grades')
      .where('user.class_id = :classId', { classId })
      .getMany();
  }

  async isStudentEnrolled(classId: string, studentId: string): Promise<boolean> {
    const userRepository = this.repository.manager.getRepository<User>('User');
    const student = await userRepository
      .createQueryBuilder('user')
      .where('user.id = :studentId', { studentId })
      .andWhere('user.class_id = :classId', { classId })
      .getOne();
    return !!student;
  }
}

