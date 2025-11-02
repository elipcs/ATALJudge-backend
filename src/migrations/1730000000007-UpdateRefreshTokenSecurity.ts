import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateRefreshTokenSecurity1730000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_tokens');

    const tokenHashColumn = table?.findColumnByName('token_hash');
    if (!tokenHashColumn) {
      await queryRunner.addColumn('refresh_tokens', new TableColumn({
        name: 'token_hash',
        type: 'varchar',
        length: '64',
        isNullable: true, 
        isUnique: true
      }));
    }

    const familyIdColumn = table?.findColumnByName('family_id');
    if (!familyIdColumn) {
      await queryRunner.addColumn('refresh_tokens', new TableColumn({
        name: 'family_id',
        type: 'uuid',
        isNullable: true
      }));
    }

    const lastUsedColumn = table?.findColumnByName('last_used_at');
    if (!lastUsedColumn) {
      await queryRunner.addColumn('refresh_tokens', new TableColumn({
        name: 'last_used_at',
        type: 'timestamp with time zone',
        isNullable: true
      }));
    }

    await queryRunner.query(`
      UPDATE refresh_tokens 
      SET is_revoked = true
      WHERE token_hash IS NULL
    `);

    const tokenColumn = table?.findColumnByName('token');
    if (tokenColumn) {
      
      await queryRunner.query(`
        ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS UQ_refresh_tokens_token
      `);
      
      await queryRunner.dropColumn('refresh_tokens', 'token');
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_tokens');

    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_family`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_expires`);

    const tokenColumn = table?.findColumnByName('token');
    if (!tokenColumn) {
      await queryRunner.addColumn('refresh_tokens', new TableColumn({
        name: 'token',
        type: 'varchar',
        length: '500',
        isNullable: true,
        isUnique: true
      }));
    }

    const lastUsedColumn = table?.findColumnByName('last_used_at');
    if (lastUsedColumn) {
      await queryRunner.dropColumn('refresh_tokens', 'last_used_at');
    }

    const familyIdColumn = table?.findColumnByName('family_id');
    if (familyIdColumn) {
      await queryRunner.dropColumn('refresh_tokens', 'family_id');
    }

    const tokenHashColumn = table?.findColumnByName('token_hash');
    if (tokenHashColumn) {
      await queryRunner.dropColumn('refresh_tokens', 'token_hash');
    }
  }
}

