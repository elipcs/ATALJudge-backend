import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropClassStudentsTable1730000000018 implements MigrationInterface {
  name = 'DropClassStudentsTable1730000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remover a tabela class_students que não é mais necessária
    // pois estamos usando o campo class_id na tabela users
    await queryRunner.dropTable('class_students', true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recriar a tabela em caso de rollback
    await queryRunner.createTable(
      new (require('typeorm').Table)({
        name: 'class_students',
        columns: [
          {
            name: 'class_id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true
          }
        ],
        foreignKeys: [
          {
            columnNames: ['class_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'classes',
            onDelete: 'CASCADE'
          },
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE'
          }
        ]
      }),
      true
    );
  }
}
