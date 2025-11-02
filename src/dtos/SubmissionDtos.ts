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

  constructor(partial: Partial<SubmissionResponseDTO>) {
    Object.assign(this, partial);
  }
}

export class TestCaseResultDTO {
  testCaseId!: string;
  isSample!: boolean;
  verdict!: JudgeVerdict;
  passed!: boolean;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  errorMessage?: string;

  constructor(partial: Partial<TestCaseResultDTO>) {
    Object.assign(this, partial);
  }
}

export class HiddenTestsSummaryDTO {
  total!: number;
  passed!: number;
  failed!: number;

  constructor(partial: Partial<HiddenTestsSummaryDTO>) {
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

  sampleTestResults!: TestCaseResultDTO[];
  hiddenTestsSummary!: HiddenTestsSummaryDTO;

  constructor(partial: Partial<SubmissionDetailDTO>) {
    Object.assign(this, partial);
  }
}

