import { ChildEntity, Column, OneToMany } from 'typeorm';
import { User } from './User';
import { UserRole } from '../enums';
import { Grade } from './Grade';

/**
 * Entidade Student - representa um estudante
 */
@ChildEntity(UserRole.STUDENT)
export class Student extends User {
  @Column({ name: 'student_registration', length: 100, nullable: true })
  studentRegistration?: string;

  // Relacionamento com notas
  @OneToMany(() => Grade, grade => grade.student)
  grades!: Grade[];
}

