import { IsString, MinLength } from 'class-validator';

/**
 * DTO para criação de turma
 */
export class CreateClassDTO {
  @IsString()
  @MinLength(3, { message: 'Nome da turma deve ter pelo menos 3 caracteres' })
  name!: string;
}

/**
 * Informações resumidas de professor
 */
export interface ProfessorInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Informações resumidas de estudante
 */
export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  studentRegistration?: string;
  createdAt: string;
}

/**
 * DTO de resposta de turma
 */
export class ClassResponseDTO {
  id!: string;
  name!: string;
  
  // IDs (sempre presentes)
  professorId!: string;
  studentIds?: string[];
  
  // Objetos completos (opcionais, quando includeRelations=true)
  professor?: ProfessorInfo;
  students?: StudentInfo[];
  
  // Metadados
  studentCount?: number;
  
  // Timestamps
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<ClassResponseDTO>) {
    Object.assign(this, partial);
  }
}

