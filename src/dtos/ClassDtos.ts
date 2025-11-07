/**
 * Class (Turma) Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for class/course management.
 * Includes professor and student information related to classes.
 * 
 * @module dtos/ClassDtos
 */
import { IsString, MinLength } from 'class-validator';

/**
 * DTO for creating a new class
 * 
 * @class CreateClassDTO
 */
export class CreateClassDTO {
  /** Class name/identifier */
  @IsString()
  @MinLength(3, { message: 'Class name must have at least 3 characters' })
  name!: string;
}

/**
 * Interface for professor information
 * 
 * @interface ProfessorInfo
 */
export interface ProfessorInfo {
  /** Professor's unique identifier */
  id: string;
  
  /** Professor's full name */
  name: string;
  
  /** Professor's email address */
  email: string;
  
  /** Professor's role in the system */
  role: string;
}

/**
 * Interface for student grade information in a class
 * 
 * @interface StudentGrade
 */
export interface StudentGrade {
  /** Grade identifier */
  id: string;
  
  /** Question list identifier */
  questionListId: string;
  
  /** Grade score */
  score: number;
  
  /** Grade creation timestamp */
  createdAt: string;
  
  /** Grade last update timestamp */
  updatedAt: string;
}

/**
 * Interface for student information in a class
 * 
 * @interface StudentInfo
 */
export interface StudentInfo {
  /** Student's unique identifier */
  id: string;
  
  /** Student's full name */
  name: string;
  
  /** Student's email address */
  email: string;
  
  /** Student's role in the system */
  role: string;
  
  /** Student registration/enrollment number */
  studentRegistration?: string;
  
  /** Student's grades in the class */
  grades?: StudentGrade[];
  createdAt: string;
}

export class ClassResponseDTO {
  id!: string;
  name!: string;

  professorId!: string;
  professorName?: string;
  studentIds?: string[];

  professor?: ProfessorInfo;
  students?: StudentInfo[];

  studentCount?: number;

  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<ClassResponseDTO>) {
    Object.assign(this, partial);
  }
}

