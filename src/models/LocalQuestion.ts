import { ChildEntity, OneToMany } from 'typeorm';
import { Question } from './Question';
import { TestCase } from './TestCase';

@ChildEntity('local')
export class LocalQuestion extends Question {
  
  @OneToMany(() => TestCase, testCase => testCase.question, { cascade: true })
  testCases!: TestCase[];

  get judgeType(): 'local' {
    return 'local';
  }
}

