import { ChildEntity, Column } from 'typeorm';
import { Question } from './Question';

/**
 * Entidade CodeforcesQuestion - questão do Codeforces
 */
@ChildEntity('codeforces')
export class CodeforcesQuestion extends Question {
  @Column({ name: 'contest_id', type: 'varchar', length: 50, nullable: false })
  contestId!: string;

  @Column({ name: 'problem_index', type: 'varchar', length: 10, nullable: false })
  problemIndex!: string;

  @Column({ name: 'codeforces_link', type: 'varchar', length: 500, nullable: true })
  codeforcesLink?: string;

  /**
   * Getter para judgeType (sempre 'codeforces')
   */
  get judgeType(): 'codeforces' {
    return 'codeforces';
  }

  /**
   * Gera o link do Codeforces baseado em contestId e problemIndex
   */
  generateCodeforcesLink(): void {
    if (this.contestId && this.problemIndex) {
      this.codeforcesLink = `https://codeforces.com/contest/${this.contestId}/problem/${this.problemIndex}`;
    }
  }
}


