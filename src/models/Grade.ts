import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './Student';
import { QuestionList } from './QuestionList';
import { Score } from '../domain/value-objects';

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid', nullable: false })
  studentId!: string;

  @Column({ name: 'list_id', type: 'uuid', nullable: false })
  listId!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, default: 0 })
  private _score!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  // Getter e setter para Score Value Object
  get score(): number {
    return this._score;
  }

  set score(value: number) {
    const scoreVO = Score.tryCreate(value);
    if (scoreVO) {
      this._score = scoreVO.getValue();
    } else {
      this._score = value; // Permite temporariamente para validação posterior
    }
  }

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(() => Student, student => student.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => QuestionList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list!: QuestionList;

  // ============================================================
  // DOMAIN METHODS (Business Logic)
  // ============================================================

  /**
   * Verifica se a nota é aprovação (>= 60)
   */
  isPassing(_passingScore: number = 60): boolean {
    const scoreVO = Score.tryCreate(this._score);
    return scoreVO?.isPassing() || false;
  }

  /**
   * Verifica se a nota é nota máxima (100)
   */
  isPerfectScore(): boolean {
    const scoreVO = Score.tryCreate(this._score);
    return scoreVO?.isPerfect() || false;
  }

  /**
   * Obtém a porcentagem da nota (já é 0-100)
   */
  getPercentage(): number {
    return this._score;
  }

  /**
   * Verifica se a nota pode ser atualizada
   * (Notas não podem ser reduzidas, apenas aumentadas)
   */
  canBeUpdated(newScore: number): boolean {
    const currentScoreVO = Score.tryCreate(this._score);
    const newScoreVO = Score.tryCreate(newScore);
    
    if (!currentScoreVO || !newScoreVO) return false;
    
    return newScoreVO.isGreaterThan(currentScoreVO) || newScoreVO.equals(currentScoreVO);
  }

  /**
   * Atualiza a nota se o novo valor for maior
   */
  updateScore(newScore: number): boolean {
    if (this.canBeUpdated(newScore)) {
      this._score = newScore;
      return true;
    }
    return false;
  }

  /**
   * Verifica se a nota é recente (atualizada nos últimos 7 dias)
   */
  isRecent(): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.updatedAt >= sevenDaysAgo;
  }
}
