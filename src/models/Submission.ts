import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SubmissionStatus, ProgrammingLanguage } from '../enums';
import { User } from './User';
import { Question } from './Question';
import { SubmissionResult } from './SubmissionResult';

/**
 * Entidade Submission - representa uma submissão de código
 */
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

  // Relacionamentos
  @ManyToOne(() => User, user => user.submissions)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Question, question => question.submissions)
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @OneToMany(() => SubmissionResult, result => result.submission, { cascade: true })
  results!: SubmissionResult[];
}

