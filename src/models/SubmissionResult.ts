import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { JudgeVerdict } from '../enums';
import { Submission } from './Submission';
import { TestCase } from './TestCase';

@Entity('submission_results')
export class SubmissionResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'submission_id', type: 'uuid' })
  submissionId!: string;

  @Column({ name: 'test_case_id', type: 'uuid' })
  testCaseId!: string;

  @Column({
    type: 'enum',
    enum: JudgeVerdict
  })
  verdict!: JudgeVerdict;

  @Column({ name: 'execution_time_ms', type: 'int', nullable: true })
  executionTimeMs?: number;

  @Column({ name: 'memory_used_kb', type: 'int', nullable: true })
  memoryUsedKb?: number;

  @Column({ type: 'text', nullable: true })
  output?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'boolean', default: false })
  passed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(() => Submission, submission => submission.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission!: Submission;

  @ManyToOne(() => TestCase)
  @JoinColumn({ name: 'test_case_id' })
  testCase!: TestCase;
}

