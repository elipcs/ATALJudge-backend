import { IsString, MinLength } from 'class-validator';

export class CreateClassDTO {
  @IsString()
  @MinLength(3, { message: 'Nome da turma deve ter pelo menos 3 caracteres' })
  name!: string;
}

export interface ProfessorInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface StudentGrade {
  id: string;
  listId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  studentRegistration?: string;
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

