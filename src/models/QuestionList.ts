import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinColumn, JoinTable, BeforeInsert, BeforeUpdate } from 'typeorm';
import { User } from './User';
import { Question } from './Question';
import { Class } from './Class';
import { ValidationError } from '../utils';

/**
 * Interface para grupos de questões
 */
export interface QuestionGroup {
  id: string;
  name: string;
  questionIds: string[];
  weight: number;
  percentage?: number;
}

/**
 * Entidade QuestionList - representa uma lista de questões
 */
@Entity('question_lists')
export class QuestionList {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId?: string;

  @Column({ name: 'start_date', type: 'timestamp with time zone', nullable: true })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone', nullable: true })
  endDate!: Date;

  @Column({ name: 'scoring_mode', type: 'varchar', length: 20, default: 'simple' })
  scoringMode!: 'simple' | 'groups';

  @Column({ name: 'max_score', type: 'int', default: 10 })
  maxScore!: number;

  @Column({ name: 'min_questions_for_max_score', type: 'int', nullable: true })
  minQuestionsForMaxScore?: number;

  @Column({ name: 'question_groups', type: 'jsonb', default: [] })
  questionGroups!: QuestionGroup[];

  @Column({ name: 'is_restricted', type: 'boolean', default: false })
  isRestricted!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relacionamentos
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: User;

  @ManyToMany(() => Question)
  @JoinTable({
    name: 'question_list_questions',
    joinColumn: { name: 'list_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'question_id', referencedColumnName: 'id' }
  })
  questions!: Question[];

  @ManyToMany(() => Class)
  @JoinTable({
    name: 'question_list_classes',
    joinColumn: { name: 'list_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'class_id', referencedColumnName: 'id' }
  })
  classes!: Class[];

  /**
   * Validações antes de inserir/atualizar
   */
  @BeforeInsert()
  @BeforeUpdate()
  validate(): void {
    if (!this.title || !this.title.trim()) {
      throw new ValidationError('Título não pode estar vazio', 'TITLE_REQUIRED');
    }

    if (this.scoringMode !== 'simple' && this.scoringMode !== 'groups') {
      throw new ValidationError('Modo de pontuação deve ser "simple" ou "groups"', 'INVALID_SCORING_MODE');
    }

    if (this.maxScore < 0) {
      throw new ValidationError('Pontuação máxima não pode ser negativa', 'INVALID_MAX_SCORE');
    }
  }

  /**
   * Verifica se a lista está aberta (dentro do período)
   */
  isOpen(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  /**
   * Calcula status calculado
   */
  getCalculatedStatus(): 'next' | 'open' | 'closed' {
    const now = new Date();
    if (now < this.startDate) {
      return 'next';
    }
    
    if (now > this.endDate) {
      return 'closed';
    }
    
    return 'open';
  }
}


