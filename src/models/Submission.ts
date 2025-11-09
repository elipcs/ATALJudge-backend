import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SubmissionStatus, ProgrammingLanguage } from '../enums';
import { User } from './User';
import { Question } from './Question';
import { SubmissionResult } from './SubmissionResult';
import { Score, SubmissionCode } from '../domain/value-objects';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @Column({ type: 'text' })
  code!: string;

  @Column({
    type: 'enum',
    enum: ProgrammingLanguage
  })
  language!: ProgrammingLanguage;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING
  })
  status!: SubmissionStatus;

  @Column({ type: 'int', default: 0 })
  score!: number;

  @Column({ name: 'total_tests', type: 'int', default: 0 })
  totalTests!: number;

  @Column({ name: 'passed_tests', type: 'int', default: 0 })
  passedTests!: number;

  @Column({ name: 'execution_time_ms', type: 'int', nullable: true })
  executionTimeMs?: number;

  @Column({ name: 'memory_used_kb', type: 'int', nullable: true })
  memoryUsedKb?: number;

  @Column({ type: 'text', nullable: true })
  verdict?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.submissions)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Question, question => question.submissions)
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @OneToMany(() => SubmissionResult, result => result.submission, { cascade: true })
  results!: SubmissionResult[];

  // ============================================================
  // DOMAIN METHODS (Business Logic)
  // ============================================================

  /**
   * Checks if the submission can be resubmitted
   */
  canBeResubmitted(): boolean {
    return this.status === SubmissionStatus.ERROR || 
           this.status === SubmissionStatus.COMPLETED;
  }

  /**
   * Checks if the submission is processing
   */
  isProcessing(): boolean {
    return this.status === SubmissionStatus.IN_QUEUE || 
           this.status === SubmissionStatus.RUNNING;
  }

  /**
   * Checks if the submission is pending or queued
   */
  isWaiting(): boolean {
    return this.status === SubmissionStatus.PENDING || 
           this.status === SubmissionStatus.IN_QUEUE;
  }

  /**
   * Checks if the submission is finished (success or error)
   */
  isFinished(): boolean {
    return this.status === SubmissionStatus.COMPLETED || 
           this.status === SubmissionStatus.ERROR;
  }

  /**
   * Calculates the score based on passed tests
   */
  calculateScore(passedTests: number, totalTests: number): number {
    if (totalTests === 0) return 0;
    const percentage = (passedTests / totalTests) * 100;
    const scoreVO = Score.tryCreate(Math.round(percentage)) || Score.zero();
    return scoreVO.getValue();
  }

  /**
   * Marks the submission as processing
   * @throws Error if not in a valid state for processing
   */
  markAsProcessing(): void {
    if (!this.isWaiting()) {
      throw new Error(`Submission cannot be processed in current state: ${this.status}`);
    }
    this.status = SubmissionStatus.RUNNING;
  }

  /**
   * Marks the submission as successfully completed
   */
  markAsCompleted(passedTests: number, totalTests: number): void {
    this.status = SubmissionStatus.COMPLETED;
    this.passedTests = passedTests;
    this.totalTests = totalTests;
    this.score = this.calculateScore(passedTests, totalTests);
  }

  /**
   * Marks the submission as failed
   */
  markAsFailed(errorMessage: string): void {
    this.status = SubmissionStatus.ERROR;
    this.errorMessage = errorMessage;
  }

  /**
   * Adds the submission to the queue
   * @throws Error if not in PENDING state
   */
  enqueue(): void {
    if (this.status !== SubmissionStatus.PENDING) {
      throw new Error(`Only PENDING submissions can be queued. Current state: ${this.status}`);
    }
    this.status = SubmissionStatus.IN_QUEUE;
  }

  /**
   * Checks if the submission passed all tests
   */
  hasPassedAllTests(): boolean {
    return this.totalTests > 0 && this.passedTests === this.totalTests;
  }

  /**
   * Gets the percentage of passed tests
   */
  getPassPercentage(): number {
    if (this.totalTests === 0) return 0;
    return (this.passedTests / this.totalTests) * 100;
  }

  /**
   * Gets the code size in bytes
   */
  getCodeSizeInBytes(): number {
    const codeVO = SubmissionCode.tryCreate(this.code);
    return codeVO?.getSizeInBytes() || 0;
  }

  /**
   * Gets the number of code lines
   */
  getCodeLineCount(): number {
    const codeVO = SubmissionCode.tryCreate(this.code);
    return codeVO?.getLineCount() || 0;
  }

  /**
   * Gets a preview of the code (first N lines)
   */
  getCodePreview(lines: number = 10): string {
    const codeVO = SubmissionCode.tryCreate(this.code);
    return codeVO?.getPreview(lines) || this.code.substring(0, 500);
  }
}
