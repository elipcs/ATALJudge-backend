import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordResetFields1730000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    
    // Adicionar coluna reset_password_token
    const resetTokenColumn = table?.findColumnByName('reset_password_token');
    if (!resetTokenColumn) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'reset_password_token',
        type: 'varchar',
        length: '255',
        isNullable: true
      }));
    }

    // Adicionar coluna reset_password_expires
    const resetExpiresColumn = table?.findColumnByName('reset_password_expires');
    if (!resetExpiresColumn) {
      await queryRunner.addColumn('users', new TableColumn({
        name: 'reset_password_expires',
        type: 'timestamp with time zone',
        isNullable: true
      }));
    }

    // Criar índice em reset_password_token para performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token)
    `);

    // Criar índice em reset_password_expires para limpeza de tokens expirados
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_expires ON users(reset_password_expires)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_reset_token`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_reset_expires`);

    // Remover coluna reset_password_expires
    const resetExpiresColumn = table?.findColumnByName('reset_password_expires');
    if (resetExpiresColumn) {
      await queryRunner.dropColumn('users', 'reset_password_expires');
    }

    // Remover coluna reset_password_token
    const resetTokenColumn = table?.findColumnByName('reset_password_token');
    if (resetTokenColumn) {
      await queryRunner.dropColumn('users', 'reset_password_token');
    }
  }
}





