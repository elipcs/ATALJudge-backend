import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { User } from './User';
import { Submission } from './Submission';
import { TestCase } from './TestCase';
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: User;

  @OneToMany(() => TestCase, testCase => testCase.question, { cascade: true })
  testCases!: TestCase[];

  @OneToMany(() => Submission, submission => submission.question)
  submissions!: Submission[];

  @BeforeInsert()
  @BeforeUpdate()
  validate(): void {
    if (!this.title || !this.title.trim()) {
      throw new ValidationError('Título não pode estar vazio', 'TITLE_REQUIRED');
    }

    if (!this.statement || !this.statement.trim()) {
      throw new ValidationError('Enunciado não pode estar vazio', 'STATEMENT_REQUIRED');
    }

    if (this.timeLimitMs < 100 || this.timeLimitMs > 30000) {
      throw new ValidationError('Limite de tempo deve estar entre 100ms e 30000ms', 'INVALID_TIME_LIMIT');
    }

    if (this.memoryLimitKb < 1000 || this.memoryLimitKb > 512000) {
      throw new ValidationError('Limite de memória deve estar entre 1MB e 512MB', 'INVALID_MEMORY_LIMIT');
    }

    if (this.wallTimeLimitSeconds && (this.wallTimeLimitSeconds < 1 || this.wallTimeLimitSeconds > 60)) {
      throw new ValidationError('Limite de wall time deve estar entre 1s e 60s', 'INVALID_WALL_TIME_LIMIT');
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
}

