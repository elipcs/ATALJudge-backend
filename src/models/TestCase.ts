import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Question } from './Question';

@Entity('test_cases')
export class TestCase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @Column({ type: 'text' })
  input!: string;

  @Column({ name: 'expected_output', type: 'text' })
  expectedOutput!: string;

  @Column({ type: 'int', default: 0 })
  weight!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;
}

