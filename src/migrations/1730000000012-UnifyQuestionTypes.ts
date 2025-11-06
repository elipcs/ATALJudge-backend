import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UnifyQuestionTypes1730000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar novo campo submissionType à tabela questions (se não existir)
    const table = await queryRunner.getTable('questions');
    const hasSubmissionType = table?.findColumnByName('submission_type');
    
    if (!hasSubmissionType) {
      await queryRunner.addColumn(
        'questions',
        new TableColumn({
          name: 'submission_type',
          type: 'varchar',
          length: '20',
          isNullable: true,
          default: `'local'`
        })
      );
    }

    // 2. Atualizar o campo submissionType baseado na coluna type existente (se existir)
    const typeColumn = table?.findColumnByName('type');
    if (typeColumn) {
      // Primeiro, copiar dados de questões que estão em questions
      await queryRunner.query(`
        UPDATE questions
        SET submission_type = 'local'
        WHERE type = 'local' OR type IS NULL OR type = ''
      `);

      // Mesclar dados de questões_codeforces se a tabela existir
      const codeforcesTableExists = await queryRunner.hasTable('questions_codeforces');
      if (codeforcesTableExists) {
        await queryRunner.query(`
          UPDATE questions q
          SET 
            submission_type = 'codeforces',
            contest_id = cq.contest_id,
            problem_index = cq.problem_index,
            codeforces_link = cq.codeforces_link
          FROM questions_codeforces cq
          WHERE q.id = cq.id
        `);
      }

      // 3. Deletar a tabela de relacionamento questions_local (se existir)
      const localTableExists = await queryRunner.hasTable('questions_local');
      if (localTableExists) {
        await queryRunner.dropTable('questions_local', true);
      }

      // 4. Deletar a tabela de relacionamento questions_codeforces (se existir)
      if (codeforcesTableExists) {
        await queryRunner.dropTable('questions_codeforces', true);
      }

      // 5. Remover coluna type (era usada para discriminação)
      await queryRunner.dropColumn('questions', 'type');
    } else {
      // Se não houver coluna 'type', significa que o banco já está parcialmente migrado
      // Apenas garantir que submission_type tenha um valor padrão
      await queryRunner.query(`
        UPDATE questions
        SET submission_type = 'local'
        WHERE submission_type IS NULL OR submission_type = ''
      `);
    }

    // 6. Tornar submission_type NOT NULL
    const updatedTable = await queryRunner.getTable('questions');
    const submissionTypeColumn = updatedTable?.findColumnByName('submission_type');
    
    if (submissionTypeColumn && submissionTypeColumn.isNullable) {
      await queryRunner.changeColumn(
        'questions',
        'submission_type',
        new TableColumn({
          name: 'submission_type',
          type: 'varchar',
          length: '20',
          isNullable: false,
          default: `'local'`
        })
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Reverter a migração (opcional, mas recomendado para rollback)
    // Nota: Esta é uma operação destrutiva, portanto a reversão é complexa
    // Por enquanto, apenas documentamos que seria necessário recriar as tabelas filhas
    
    throw new Error('Downgrade não é suportado para esta migração devido à consolidação de dados');
  }
}
