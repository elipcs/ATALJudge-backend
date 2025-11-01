import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, BeforeInsert, BeforeUpdate, TableInheritance } from 'typeorm';
import { User } from './User';
import { Submission } from './Submission';
import { ValidationError } from '../utils';

/**
 * Interface para exemplos de entrada/saída
 */
export interface QuestionExample {
  input: string;
  output: string;
}

/**
 * Entidade Question - classe base para questões de programação
 * Usa Single Table Inheritance para separar LocalQuestion e CodeforcesQuestion
 */
@Entity('questions')
@TableInheritance({ column: { type: 'varchar', name: 'type', default: 'local' } })
export abstract class Question {
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relacionamentos
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: User;

  @OneToMany(() => Submission, submission => submission.question)
  submissions!: Submission[];

  /**
   * Validações antes de inserir/atualizar
   */
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

  /**
   * Retorna o tempo limite de CPU em segundos (para Judge0)
   */
  getCpuTimeLimitSeconds(): number {
    return this.timeLimitMs / 1000;
  }

  /**
   * Retorna o limite de memória em KB (para Judge0)
   */
  getMemoryLimitKb(): number {
    return this.memoryLimitKb;
  }

  /**
   * Retorna o limite de wall time em segundos (para Judge0)
   */
  getWallTimeLimitSeconds(): number | undefined {
    return this.wallTimeLimitSeconds;
  }
}

