import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddTestCaseIndexes1730000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar índices para melhorar performance de queries em test_cases
    
    // Índice por question_id (queries mais comuns)
    await queryRunner.createIndex('test_cases', new TableIndex({
      name: 'idx_test_cases_question',
      columnNames: ['question_id']
    }));

    // Índice por is_sample (para buscar casos de exemplo)
    await queryRunner.createIndex('test_cases', new TableIndex({
      name: 'idx_test_cases_sample',
      columnNames: ['is_sample']
    }));

    // Índice por is_active (para buscar apenas ativos)
    await queryRunner.createIndex('test_cases', new TableIndex({
      name: 'idx_test_cases_active',
      columnNames: ['is_active']
    }));

    // Índice composto para queries comuns
    await queryRunner.createIndex('test_cases', new TableIndex({
      name: 'idx_test_cases_question_active',
      columnNames: ['question_id', 'is_active']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('test_cases', 'idx_test_cases_question');
    await queryRunner.dropIndex('test_cases', 'idx_test_cases_sample');
    await queryRunner.dropIndex('test_cases', 'idx_test_cases_active');
    await queryRunner.dropIndex('test_cases', 'idx_test_cases_question_active');
  }
}


