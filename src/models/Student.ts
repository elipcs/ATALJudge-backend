import { ChildEntity, Column, OneToMany } from 'typeorm';
import { User } from './User';
import { UserRole } from '../enums';
import { Grade } from './Grade';
import { StudentRegistration } from '../domain/value-objects';

@ChildEntity(UserRole.STUDENT)
export class Student extends User {
  @Column({ name: 'student_registration', length: 100, nullable: true })
  private _studentRegistration?: string;

  @OneToMany(() => Grade, grade => grade.student)
  grades!: Grade[];

  // Getter e setter para StudentRegistration Value Object
  get studentRegistration(): string | undefined {
    return this._studentRegistration;
  }

  set studentRegistration(value: string | undefined) {
    if (!value) {
      this._studentRegistration = undefined;
      return;
    }
    
    const regVO = StudentRegistration.tryCreate(value);
    if (regVO) {
      this._studentRegistration = regVO.getValue();
    } else {
      this._studentRegistration = value; // Allows temporarily for later validation
    }
  }

  /**
   * Gets the formatted registration number (returns value only)
   */
  getFormattedRegistration(): string | undefined {
    return this._studentRegistration;
  }
}

