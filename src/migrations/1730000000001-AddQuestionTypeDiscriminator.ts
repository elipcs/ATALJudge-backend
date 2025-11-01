import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQuestionTypeDiscriminator1730000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Obter estrutura da tabela
    const table = await queryRunner.getTable('questions');
    
    // Adicionar coluna discriminador para Single Table Inheritance
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

    // Remover coluna judge_type antiga (se existir)
    const judgeTypeColumn = table?.findColumnByName('judge_type');
    if (judgeTypeColumn) {
      await queryRunner.dropColumn('questions', 'judge_type');
    }

    // Adicionar colunas do Codeforces se não existirem
    const contestIdColumn = table?.findColumnByName('contest_id');
    const codeforcesContestIdColumn = table?.findColumnByName('codeforces_contest_id');
    
    if (!contestIdColumn && !codeforcesContestIdColumn) {
      // Coluna não existe em nenhum formato, criar nova
      await queryRunner.addColumn('questions', new TableColumn({
        name: 'contest_id',
        type: 'varchar',
        length: '50',
        isNullable: true
      }));
    } else if (codeforcesContestIdColumn && !contestIdColumn) {
      // Renomear de codeforces_contest_id para contest_id
      await queryRunner.renameColumn('questions', 'codeforces_contest_id', 'contest_id');
    }

    const problemIndexColumn = table?.findColumnByName('problem_index');
    const codeforcesProblemIndexColumn = table?.findColumnByName('codeforces_problem_index');
    
    if (!problemIndexColumn && !codeforcesProblemIndexColumn) {
      // Coluna não existe em nenhum formato, criar nova
      await queryRunner.addColumn('questions', new TableColumn({
        name: 'problem_index',
        type: 'varchar',
        length: '10',
        isNullable: true
      }));
    } else if (codeforcesProblemIndexColumn && !problemIndexColumn) {
      // Renomear de codeforces_problem_index para problem_index
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

    // Atualizar questões existentes baseado em campos
    // Se tem contest_id, é do Codeforces
    await queryRunner.query(`
      UPDATE questions 
      SET type = 'codeforces' 
      WHERE contest_id IS NOT NULL
    `);

    // Remover campos de referência que não são mais usados
    const referenceCodeColumn = table?.findColumnByName('reference_code');
    if (referenceCodeColumn) {
      await queryRunner.dropColumn('questions', 'reference_code');
    }

    const referenceLanguageColumn = table?.findColumnByName('reference_language');
    if (referenceLanguageColumn) {
      await queryRunner.dropColumn('questions', 'reference_language');
    }

    // Criar índice no campo type para performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter índice
    await queryRunner.query(`DROP INDEX IF EXISTS idx_questions_type`);

    // Obter estrutura da tabela
    const table = await queryRunner.getTable('questions');
    
    // Remover colunas do Codeforces
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

    // Recriar judge_type se não existir
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

    // Remover coluna type
    const typeColumn = table?.findColumnByName('type');
    if (typeColumn) {
      await queryRunner.dropColumn('questions', 'type');
    }
  }
}


