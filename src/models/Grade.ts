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

  @Column({ name: 'question_list_id', type: 'uuid', nullable: false })
  questionListId!: string;

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
      this._score = value; // Allows temporarily for later validation
    }
  }

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(() => Student, student => student.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => QuestionList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_list_id' })
  questionList!: QuestionList;

  // ============================================================
  // DOMAIN METHODS (Business Logic)
  // ============================================================

  /**
   * Checks if the grade is passing (>= 60)
   */
  isPassing(_passingScore: number = 60): boolean {
    const scoreVO = Score.tryCreate(this._score);
    return scoreVO?.isPassing() || false;
  }

  /**
   * Checks if the grade is perfect (100)
   */
  isPerfectScore(): boolean {
    const scoreVO = Score.tryCreate(this._score);
    return scoreVO?.isPerfect() || false;
  }

  /**
   * Gets the grade percentage (already 0-100)
   */
  getPercentage(): number {
    return this._score;
  }

  /**
   * Checks if the grade can be updated
   * (Grades cannot be reduced, only increased)
   */
  canBeUpdated(newScore: number): boolean {
    const currentScoreVO = Score.tryCreate(this._score);
    const newScoreVO = Score.tryCreate(newScore);
    
    if (!currentScoreVO || !newScoreVO) return false;
    
    return newScoreVO.isGreaterThan(currentScoreVO) || newScoreVO.equals(currentScoreVO);
  }

  /**
   * Updates the grade if the new value is higher
   */
  updateScore(newScore: number): boolean {
    if (this.canBeUpdated(newScore)) {
      this._score = newScore;
      return true;
    }
    return false;
  }

  /**
   * Checks if the grade is recent (updated within the last 7 days)
   */
  isRecent(): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.updatedAt >= sevenDaysAgo;
  }
}
