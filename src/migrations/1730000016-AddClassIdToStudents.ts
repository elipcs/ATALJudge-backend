import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddClassIdToStudents1730000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna class_id à tabela users
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'class_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Adicionar foreign key
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['class_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'classes',
        onDelete: 'SET NULL',
      })
    );

    // Criar índice
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        columnNames: ['class_id'],
        name: 'idx_users_class_id',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índice
    await queryRunner.dropIndex('users', 'idx_users_class_id');

    // Remover foreign key
    const table = await queryRunner.getTable('users');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.includes('class_id')
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('users', foreignKey);
    }

    // Remover coluna
    await queryRunner.dropColumn('users', 'class_id');
  }
}
