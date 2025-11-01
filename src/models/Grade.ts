import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './Student';
import { QuestionList } from './QuestionList';

/**
 * Entidade Grade - representa a nota de um estudante em uma lista de questões
 */
@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_id', type: 'uuid', nullable: false })
  studentId!: string;

  @Column({ name: 'list_id', type: 'uuid', nullable: false })
  listId!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, default: 0 })
  score!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relacionamentos
  @ManyToOne(() => Student, student => student.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @ManyToOne(() => QuestionList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list!: QuestionList;
}

