import { ChildEntity, Column, OneToMany } from 'typeorm';
import { User } from './User';
import { UserRole } from '../enums';
import { Grade } from './Grade';

@ChildEntity(UserRole.STUDENT)
export class Student extends User {
  @Column({ name: 'student_registration', length: 100, nullable: true })
  studentRegistration?: string;

  @OneToMany(() => Grade, grade => grade.student)
  grades!: Grade[];

  /**
   * Gets the formatted registration number (returns value only)
   */
  getFormattedRegistration(): string | undefined {
    return this.studentRegistration;
  }
}

