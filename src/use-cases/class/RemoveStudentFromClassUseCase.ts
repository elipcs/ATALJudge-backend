import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { ClassRepository, UserRepository } from '../../repositories';
import { NotFoundError, ValidationError } from '../../utils';
import { UserRole } from '../../enums';

export interface RemoveStudentFromClassInput {
  classId: string;
  studentId: string;
}

@injectable()
export class RemoveStudentFromClassUseCase implements IUseCase<RemoveStudentFromClassInput, void> {
  constructor(
    @inject(ClassRepository) private classRepository: ClassRepository,
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async execute(input: RemoveStudentFromClassInput): Promise<void> {
    const { classId, studentId } = input;

    // Check if class exists
    const classEntity = await this.classRepository.findById(classId);
    if (!classEntity) {
      throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');
    }

    // Check if student exists
    const student = await this.userRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    }

    // Check if it is a student
    if (student.role !== UserRole.STUDENT) {
      throw new ValidationError('User is not a student', 'NOT_A_STUDENT');
    }

    // Check if student is in the class
    if (student.class?.id !== classId) {
      throw new ValidationError('Student is not in this class', 'STUDENT_NOT_IN_CLASS');
    }

    // Remove student from class (set class to null)
    await this.userRepository.update(studentId, { class: null as any });
  }
}
