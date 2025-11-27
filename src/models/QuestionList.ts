import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Question } from './Question';
import { Class } from './Class';
import { ValidationError } from '../utils';

export interface QuestionGroup {
  id: string;
  name: string;
  questionIds: string[];
  weight: number;
  percentage?: number;
}

@Entity('question_lists')
export class QuestionList {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

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

  @Column({ name: 'count_toward_score', type: 'boolean', default: true })
  countTowardScore!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToMany(() => Question, question => question.questionLists)
  @JoinTable({
    name: 'question_list_questions',
    joinColumn: { name: 'question_list_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'question_id', referencedColumnName: 'id' }
  })
  questions!: Question[];

  @ManyToMany(() => Class)
  @JoinTable({
    name: 'question_list_classes',
    joinColumn: { name: 'question_list_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'class_id', referencedColumnName: 'id' }
  })
  classes!: Class[];

  @BeforeInsert()
  @BeforeUpdate()
  validate(): void {
    if (!this.title || !this.title.trim()) {
      throw new ValidationError('Title cannot be empty', 'TITLE_REQUIRED');
    }

    if (this.scoringMode !== 'simple' && this.scoringMode !== 'groups') {
      throw new ValidationError('Scoring mode must be "simple" or "groups"', 'INVALID_SCORING_MODE');
    }

    if (this.maxScore < 0) {
      throw new ValidationError('Maximum score cannot be negative', 'INVALID_MAX_SCORE');
    }
  }

  isOpen(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

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

  // ============================================================
  // ADDITIONAL DOMAIN METHODS (Business Logic)
  // ============================================================

  /**
   * Checks if the list has questions
   */
  hasQuestions(): boolean {
    return this.questions && this.questions.length > 0;
  }

  /**
   * Gets the number of questions in the list
   */
  getQuestionCount(): number {
    return this.questions ? this.questions.length : 0;
  }

  /**
   * Checks if the list is active (open for submissions)
   */
  isActive(): boolean {
    return this.isOpen();
  }

  /**
   * Checks if the list is closed
   */
  isClosed(): boolean {
    return this.getCalculatedStatus() === 'closed';
  }

  /**
   * Checks if the list has not opened yet
   */
  isNotOpenYet(): boolean {
    return this.getCalculatedStatus() === 'next';
  }

  /**
   * Calculates the maximum possible score
   * In simple mode: maxScore
   * In groups mode: sum of group weights
   */
  calculateMaxPossibleScore(): number {
    if (this.scoringMode === 'simple') {
      return this.maxScore;
    }
    
    // Groups mode
    if (!this.questionGroups || this.questionGroups.length === 0) {
      return this.maxScore;
    }
    
    return this.questionGroups.reduce((sum, group) => sum + group.weight, 0);
  }

  /**
   * Checks if the list uses group-based scoring
   */
  usesGroupScoring(): boolean {
    return this.scoringMode === 'groups';
  }

  /**
   * Checks if the list uses simple scoring
   */
  usesSimpleScoring(): boolean {
    return this.scoringMode === 'simple';
  }

  /**
   * Checks if the list has class-specific restrictions
   */
  hasClassRestrictions(): boolean {
    return this.isRestricted;
  }

  /**
   * Gets the remaining time in milliseconds
   */
  getTimeRemainingMs(): number {
    const now = new Date();
    if (now >= this.endDate) return 0;
    return this.endDate.getTime() - now.getTime();
  }

  /**
   * Gets the formatted remaining time
   */
  getTimeRemainingFormatted(): string {
    const ms = this.getTimeRemainingMs();
    if (ms === 0) return 'Closed';

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  /**
   * Checks if the list can be edited
   * (Cannot edit lists that are already closed)
   */
  canBeEdited(): boolean {
    return !this.isClosed();
  }

  /**
   * Checks if the list can be deleted
   * (Cannot delete open lists or lists with submissions)
   */
  canBeDeleted(): boolean {
    return this.isNotOpenYet();
  }

  /**
   * Gets the group for a specific question
   */
  getQuestionGroup(questionId: string): QuestionGroup | undefined {
    if (!this.questionGroups) return undefined;
    return this.questionGroups.find(group => 
      group.questionIds.includes(questionId)
    );
  }
}
