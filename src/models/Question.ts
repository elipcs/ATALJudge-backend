import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Submission } from './Submission';
import { TestCase } from './TestCase';
import { QuestionList } from './QuestionList';
import { ValidationError } from '../utils';

export interface QuestionExample {
  input: string;
  output: string;
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: false })
  text!: string;

  @Column({ name: 'time_limit_ms', type: 'int', default: 1000 })
  timeLimitMs!: number;

  @Column({ name: 'memory_limit_kb', type: 'int', default: 64000 })
  memoryLimitKb!: number;



  @Column({ type: 'jsonb', default: [] })
  examples!: QuestionExample[];

  @Column({ name: 'oracle_code', type: 'text', nullable: true })
  oracleCode?: string;

  @Column({ name: 'oracle_language', type: 'varchar', length: 20, nullable: true })
  oracleLanguage?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  source?: string;

  @Column({ type: 'jsonb', default: [] })
  tags!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToMany(() => QuestionList, questionList => questionList.questions)
  questionLists!: QuestionList[];

  @OneToMany(() => TestCase, testCase => testCase.question, { cascade: true })
  testCases!: TestCase[];

  @OneToMany(() => Submission, submission => submission.question)
  submissions!: Submission[];

  @BeforeInsert()
  @BeforeUpdate()
  validate(): void {
    if (!this.title || !this.title.trim()) {
      throw new ValidationError('Title cannot be empty', 'TITLE_REQUIRED');
    }

    if (!this.text || !this.text.trim()) {
      throw new ValidationError('Text cannot be empty', 'TEXT_REQUIRED');
    }

    if (this.timeLimitMs < 100 || this.timeLimitMs > 30000) {
      throw new ValidationError('Time limit must be between 100ms and 30000ms', 'INVALID_TIME_LIMIT');
    }

    if (this.memoryLimitKb < 1000 || this.memoryLimitKb > 512000) {
      throw new ValidationError('Memory limit must be between 1MB and 512MB', 'INVALID_MEMORY_LIMIT');
    }
  }

  getCpuTimeLimitSeconds(): number {
    return this.timeLimitMs / 1000;
  }

  getMemoryLimitKb(): number {
    return this.memoryLimitKb;
  }

  // ============================================================
  // ADDITIONAL DOMAIN METHODS (Business Logic)
  // ============================================================

  /**
   * Checks if the question has test cases
   */
  hasTestCases(): boolean {
    return this.testCases && this.testCases.length > 0;
  }

  /**
   * Gets the number of test cases
   */
  getTestCaseCount(): number {
    return this.testCases ? this.testCases.length : 0;
  }

  /**
   * Checks if the question can be deleted
   * Cannot delete if it has submissions
   */
  canBeDeleted(): boolean {
    return !this.submissions || this.submissions.length === 0;
  }

  /**
   * Checks if the question is ready for use
   * (has all required fields and at least 1 test case)
   */
  isReady(): boolean {
    return !!(
      this.title?.trim() &&
      this.text?.trim() &&
      this.hasTestCases()
    );
  }

  /**
   * Checks if the question has examples
   */
  hasExamples(): boolean {
    return this.examples && this.examples.length > 0;
  }
}
