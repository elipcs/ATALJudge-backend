import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordResetFields1730000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    const resetTokenColumn = table?.findColumnByName('reset_password_token');
    if (!resetTokenColumn) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'reset_password_token',
        type: 'varchar',
        length: '255',
        isNullable: true
      }));
    }

    const resetExpiresColumn = table?.findColumnByName('reset_password_expires');
    if (!resetExpiresColumn) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'reset_password_expires',
        type: 'timestamp with time zone',
        isNullable: true
      }));
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_expires ON users(reset_password_expires)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_reset_token`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_reset_expires`);

    const resetExpiresColumn = table?.findColumnByName('reset_password_expires');
    if (resetExpiresColumn) {
      await queryRunner.dropColumn('users', 'reset_password_expires');
    }

    const resetTokenColumn = table?.findColumnByName('reset_password_token');
    if (resetTokenColumn) {
      await queryRunner.dropColumn('users', 'reset_password_token');
    }
  }
}

