import { ChildEntity, OneToMany } from 'typeorm';
import { Question } from './Question';
import { TestCase } from './TestCase';

/**
 * Entidade LocalQuestion - questão avaliada localmente com test cases
 */
@ChildEntity('local')
export class LocalQuestion extends Question {
  // Relacionamento com casos de teste (apenas para questões locais)
  @OneToMany(() => TestCase, testCase => testCase.question, { cascade: true })
  testCases!: TestCase[];

  /**
   * Getter para judgeType (sempre 'local')
   */
  get judgeType(): 'local' {
    return 'local';
  }
}


