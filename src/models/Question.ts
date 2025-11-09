import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { User } from './User';
import { Submission } from './Submission';
import { TestCase } from './TestCase';
import { QuestionList } from './QuestionList';
import { ValidationError } from '../utils';

export interface QuestionExample {
  input: string;
  output: string;
}

export type SubmissionType = 'local' | 'codeforces';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: false })
  statement!: string;

  @Column({ name: 'input_format', type: 'text', default: '' })
  inputFormat!: string;

  @Column({ name: 'output_format', type: 'text', default: '' })
  outputFormat!: string;

  @Column({ type: 'text', default: '' })
  constraints!: string;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'simple-array', default: '' })
  tags!: string[];

  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId?: string;

  @Column({ name: 'time_limit_ms', type: 'int', default: 1000 })
  timeLimitMs!: number;

  @Column({ name: 'memory_limit_kb', type: 'int', default: 64000 })
  memoryLimitKb!: number;

  @Column({ name: 'wall_time_limit_s', type: 'float', nullable: true })
  wallTimeLimitSeconds?: number;

  @Column({ type: 'jsonb', default: [] })
  examples!: QuestionExample[];

  @Column({ name: 'submission_type', type: 'varchar', length: 20, default: 'local' })
  submissionType!: SubmissionType;

  @Column({ name: 'contest_id', type: 'varchar', length: 50, nullable: true })
  contestId?: string;

  @Column({ name: 'problem_index', type: 'varchar', length: 10, nullable: true })
  problemIndex?: string;

  @Column({ name: 'codeforces_link', type: 'varchar', length: 500, nullable: true })
  codeforcesLink?: string;

  @Column({ name: 'question_list_id', type: 'uuid', nullable: true })
  questionListId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: User;

  @ManyToOne(() => QuestionList, { nullable: true })
  @JoinColumn({ name: 'question_list_id' })
  questionList?: QuestionList;

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

    if (!this.statement || !this.statement.trim()) {
      throw new ValidationError('Statement cannot be empty', 'STATEMENT_REQUIRED');
    }

    if (this.timeLimitMs < 100 || this.timeLimitMs > 30000) {
      throw new ValidationError('Time limit must be between 100ms and 30000ms', 'INVALID_TIME_LIMIT');
    }

    if (this.memoryLimitKb < 1000 || this.memoryLimitKb > 512000) {
      throw new ValidationError('Memory limit must be between 1MB and 512MB', 'INVALID_MEMORY_LIMIT');
    }

    if (this.wallTimeLimitSeconds && (this.wallTimeLimitSeconds < 1 || this.wallTimeLimitSeconds > 60)) {
      throw new ValidationError('Wall time limit must be between 1s and 60s', 'INVALID_WALL_TIME_LIMIT');
    }
  }

  getCpuTimeLimitSeconds(): number {
    return this.timeLimitMs / 1000;
  }

  getMemoryLimitKb(): number {
    return this.memoryLimitKb;
  }

  getWallTimeLimitSeconds(): number | undefined {
    return this.wallTimeLimitSeconds;
  }

  isLocal(): boolean {
    return this.submissionType === 'local';
  }

  isCodeforces(): boolean {
    return this.submissionType === 'codeforces';
  }

  generateCodeforcesLink(): void {
    if (this.isCodeforces() && this.contestId && this.problemIndex) {
      this.codeforcesLink = `https://codeforces.com/contest/${this.contestId}/problem/${this.problemIndex}`;
    }
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
   * Checks if the question can be edited
   * Local questions can be edited, Codeforces cannot
   */
  canBeEdited(): boolean {
    return this.isLocal();
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
      this.statement?.trim() &&
      this.hasTestCases()
    );
  }

  /**
   * Checks if the question has examples
   */
  hasExamples(): boolean {
    return this.examples && this.examples.length > 0;
  }

  /**
   * Gets public test cases (is_sample = true)
   */
  getPublicTestCases(): TestCase[] {
    if (!this.testCases) return [];
    return this.testCases.filter(tc => tc.isSample);
  }

  /**
   * Gets private test cases (is_sample = false)
   */
  getPrivateTestCases(): TestCase[] {
    if (!this.testCases) return [];
    return this.testCases.filter(tc => !tc.isSample);
  }

  /**
   * Validates if the Codeforces configuration is complete
   */
  isCodeforcesConfigComplete(): boolean {
    if (!this.isCodeforces()) return true;
    return !!(this.contestId && this.problemIndex && this.codeforcesLink);
  }
}
