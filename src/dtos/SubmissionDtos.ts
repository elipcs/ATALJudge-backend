import { IsString, IsUUID, IsEnum, MinLength } from 'class-validator';
import { ProgrammingLanguage, SubmissionStatus, JudgeVerdict } from '../enums';

export class CreateSubmissionDTO {
  @IsUUID('4', { message: 'ID da questão deve ser um UUID válido' })
  questionId!: string;

  @IsString()
  @MinLength(1, { message: 'Código não pode estar vazio' })
  code!: string;

  @IsEnum(ProgrammingLanguage, { message: 'Linguagem de programação inválida' })
  language!: ProgrammingLanguage;
}

export class SubmissionResponseDTO {
  id!: string;
  userId!: string;
  questionId!: string;
  code!: string;
  language!: ProgrammingLanguage;
  status!: SubmissionStatus;
  score!: number;
  totalTests!: number;
  passedTests!: number;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  verdict?: string;
  errorMessage?: string;
  createdAt!: Date;
  updatedAt!: Date;
  
  // Dados do autor
  userName?: string;
  userEmail?: string;
  studentRegistration?: string;
  
  // Dados da questão
  questionName?: string;
  
  // Dados da lista
  listId?: string;
  listName?: string;

  constructor(partial: Partial<SubmissionResponseDTO>) {
    Object.assign(this, partial);
  }
}

export class TestCaseResultDTO {
  testCaseId!: string;
  verdict!: JudgeVerdict;
  passed!: boolean;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  actualOutput?: string;
  errorMessage?: string;

  constructor(partial: Partial<TestCaseResultDTO>) {
    Object.assign(this, partial);
  }
}

export class SubmissionDetailDTO {
  id!: string;
  userId!: string;
  questionId!: string;
  code!: string;
  language!: ProgrammingLanguage;
  status!: SubmissionStatus;
  score!: number;
  totalTests!: number;
  passedTests!: number;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  verdict?: string;
  errorMessage?: string;
  createdAt!: Date;
  updatedAt!: Date;

  testResults!: TestCaseResultDTO[];

  constructor(partial: Partial<SubmissionDetailDTO>) {
    Object.assign(this, partial);
  }
}

