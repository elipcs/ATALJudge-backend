import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQuestionTypeDiscriminator1730000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    
    const table = await queryRunner.getTable('questions');

    const typeColumn = table?.findColumnByName('type');
    if (!typeColumn) {
      await queryRunner.addColumn('questions', new TableColumn({
        name: 'type',
        type: 'varchar',
        length: '20',
        default: "'local'",
        isNullable: false
      }));
    }

    const judgeTypeColumn = table?.findColumnByName('judge_type');
    if (judgeTypeColumn) {
      await queryRunner.dropColumn('questions', 'judge_type');
    }

    const contestIdColumn = table?.findColumnByName('contest_id');
    const codeforcesContestIdColumn = table?.findColumnByName('codeforces_contest_id');
    
    if (!contestIdColumn && !codeforcesContestIdColumn) {
      
      await queryRunner.addColumn('questions', new TableColumn({
        name: 'contest_id',
        type: 'varchar',
        length: '50',
        isNullable: true
      }));
    } else if (codeforcesContestIdColumn && !contestIdColumn) {
      
      await queryRunner.renameColumn('questions', 'codeforces_contest_id', 'contest_id');
    }

    const problemIndexColumn = table?.findColumnByName('problem_index');
    const codeforcesProblemIndexColumn = table?.findColumnByName('codeforces_problem_index');
    
    if (!problemIndexColumn && !codeforcesProblemIndexColumn) {
      
      await queryRunner.addColumn('questions', new TableColumn({
        name: 'problem_index',
        type: 'varchar',
        length: '10',
        isNullable: true
      }));
    } else if (codeforcesProblemIndexColumn && !problemIndexColumn) {
      
      await queryRunner.renameColumn('questions', 'codeforces_problem_index', 'problem_index');
    }

    const codeforcesLinkColumn = table?.findColumnByName('codeforces_link');
    if (!codeforcesLinkColumn) {
      await queryRunner.addColumn('questions', new TableColumn({
        name: 'codeforces_link',
        type: 'varchar',
        length: '500',
        isNullable: true
      }));
    }

    await queryRunner.query(`
      UPDATE questions 
      SET type = 'codeforces' 
      WHERE contest_id IS NOT NULL
    `);

    const referenceCodeColumn = table?.findColumnByName('reference_code');
    if (referenceCodeColumn) {
      await queryRunner.dropColumn('questions', 'reference_code');
    }

    const referenceLanguageColumn = table?.findColumnByName('reference_language');
    if (referenceLanguageColumn) {
      await queryRunner.dropColumn('questions', 'reference_language');
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_questions_type`);

    const table = await queryRunner.getTable('questions');

    const codeforcesLinkColumn = table?.findColumnByName('codeforces_link');
    if (codeforcesLinkColumn) {
      await queryRunner.dropColumn('questions', 'codeforces_link');
    }

    const contestIdColumn = table?.findColumnByName('contest_id');
    if (contestIdColumn) {
      await queryRunner.dropColumn('questions', 'contest_id');
    }

    const problemIndexColumn = table?.findColumnByName('problem_index');
    if (problemIndexColumn) {
      await queryRunner.dropColumn('questions', 'problem_index');
    }

    const judgeTypeColumn = table?.findColumnByName('judge_type');
    if (!judgeTypeColumn) {
      await queryRunner.addColumn('questions', new TableColumn({
        name: 'judge_type',
        type: 'varchar',
        length: '20',
        default: "'local'",
        isNullable: false
      }));
    }

    const typeColumn = table?.findColumnByName('type');
    if (typeColumn) {
      await queryRunner.dropColumn('questions', 'type');
    }
  }
}

