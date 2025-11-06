import { BaseRepository } from './BaseRepository';
import { Class } from '../models/Class';
import { User } from '../models/User';

export class ClassRepository extends BaseRepository<Class> {
  constructor() {
    super(Class);
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

  async addStudent(classId: string, studentId: string): Promise<void> {
    // Verificar se a turma existe
    const classEntity = await this.repository.findOne({ where: { id: classId } });
    if (!classEntity) {
      throw new Error('Turma não encontrada');
    }

    // Atualizar o estudante com o classId usando raw query
    const connection = this.repository.manager.connection;
    await connection.query(
      'UPDATE users SET class_id = $1 WHERE id = $2',
      [classId, studentId]
    );
  }

  async removeStudent(classId: string, studentId: string): Promise<void> {
    // Verificar se a turma existe
    const classEntity = await this.repository.findOne({ where: { id: classId } });
    if (!classEntity) {
      throw new Error('Turma não encontrada');
    }

    // Remover o classId do estudante
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

