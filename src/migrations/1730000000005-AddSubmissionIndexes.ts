import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddSubmissionIndexes1730000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar índices para melhorar performance de queries em submissions
    
    // Índice por user_id (buscar submissões de um usuário)
    await queryRunner.createIndex('submissions', new TableIndex({
      name: 'idx_submissions_user',
      columnNames: ['user_id']
    }));

    // Índice por question_id (buscar submissões de uma questão)
    await queryRunner.createIndex('submissions', new TableIndex({
      name: 'idx_submissions_question',
      columnNames: ['question_id']
    }));

    // Índice por status (buscar submissões por status)
    await queryRunner.createIndex('submissions', new TableIndex({
      name: 'idx_submissions_status',
      columnNames: ['status']
    }));

    // Índice por created_at (ordenar por data)
    await queryRunner.createIndex('submissions', new TableIndex({
      name: 'idx_submissions_created',
      columnNames: ['created_at']
    }));

    // Índice composto para queries comuns
    await queryRunner.createIndex('submissions', new TableIndex({
      name: 'idx_submissions_user_question',
      columnNames: ['user_id', 'question_id']
    }));

    await queryRunner.createIndex('submissions', new TableIndex({
      name: 'idx_submissions_question_status',
      columnNames: ['question_id', 'status']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('submissions', 'idx_submissions_user');
    await queryRunner.dropIndex('submissions', 'idx_submissions_question');
    await queryRunner.dropIndex('submissions', 'idx_submissions_status');
    await queryRunner.dropIndex('submissions', 'idx_submissions_created');
    await queryRunner.dropIndex('submissions', 'idx_submissions_user_question');
    await queryRunner.dropIndex('submissions', 'idx_submissions_question_status');
  }
}


