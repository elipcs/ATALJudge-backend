import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWallTimeLimitToQuestions1730000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('questions');

    const wallTimeLimitColumn = table?.findColumnByName('wall_time_limit_s');
    if (!wallTimeLimitColumn) {
      await queryRunner.addColumn('questions', new TableColumn({
        name: 'wall_time_limit_s',
        type: 'float',
        isNullable: true,
        comment: 'Limite de tempo de execução real (wall time) em segundos para Judge0'
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('questions');

    const wallTimeLimitColumn = table?.findColumnByName('wall_time_limit_s');
    if (wallTimeLimitColumn) {
      await queryRunner.dropColumn('questions', 'wall_time_limit_s');
    }
  }
}

