import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddTestCaseIndexes1730000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.createIndex('test_cases', new TableIndex({
      name: 'idx_test_cases_question',
      columnNames: ['question_id']
    }));

    await queryRunner.createIndex('test_cases', new TableIndex({
      name: 'idx_test_cases_sample',
      columnNames: ['is_sample']
    }));

    await queryRunner.createIndex('test_cases', new TableIndex({
      name: 'idx_test_cases_active',
      columnNames: ['is_active']
    }));

    await queryRunner.createIndex('test_cases', new TableIndex({
      name: 'idx_test_cases_question_active',
      columnNames: ['question_id', 'is_active']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    
    await queryRunner.dropIndex('test_cases', 'idx_test_cases_question');
    await queryRunner.dropIndex('test_cases', 'idx_test_cases_sample');
    await queryRunner.dropIndex('test_cases', 'idx_test_cases_active');
    await queryRunner.dropIndex('test_cases', 'idx_test_cases_question_active');
  }
}

