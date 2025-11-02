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

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  studentRegistration?: string;
  createdAt: string;
}

export class ClassResponseDTO {
  id!: string;
  name!: string;

  professorId!: string;
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

