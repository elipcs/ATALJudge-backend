import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class MovePasswordResetToSeparateTable1730000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar tabela password_reset_tokens
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '64',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // 2. Criar foreign key para users
    await queryRunner.createForeignKey(
      'password_reset_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // 3. Criar índices
    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_token_hash',
        columnNames: ['token_hash'],
      })
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_expires_at',
        columnNames: ['expires_at'],
      })
    );

    // 4. Migrar dados existentes da tabela users para password_reset_tokens
    // Apenas se houver dados válidos (token não nulo e não expirado)
    await queryRunner.query(`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, is_used, created_at)
      SELECT 
        id as user_id,
        reset_password_token as token_hash,
        reset_password_expires as expires_at,
        false as is_used,
        NOW() as created_at
      FROM users
      WHERE reset_password_token IS NOT NULL
        AND reset_password_expires IS NOT NULL
        AND reset_password_expires > NOW()
    `);

    // 5. Remover índices antigos
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_reset_token`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_reset_expires`);

    // 6. Remover colunas da tabela users
    const table = await queryRunner.getTable('users');
    
    const resetExpiresColumn = table?.findColumnByName('reset_password_expires');
    if (resetExpiresColumn) {
      await queryRunner.dropColumn('users', 'reset_password_expires');
    }

    const resetTokenColumn = table?.findColumnByName('reset_password_token');
    if (resetTokenColumn) {
      await queryRunner.dropColumn('users', 'reset_password_token');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    // 1. Adicionar colunas de volta na tabela users
    const resetTokenColumn = table?.findColumnByName('reset_password_token');
    if (!resetTokenColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'reset_password_token',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      );
    }

    const resetExpiresColumn = table?.findColumnByName('reset_password_expires');
    if (!resetExpiresColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'reset_password_expires',
          type: 'timestamp with time zone',
          isNullable: true,
        })
      );
    }

    // 2. Recriar índices antigos
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_expires ON users(reset_password_expires)
    `);

    // 3. Migrar dados de volta (apenas tokens não usados e não expirados)
    await queryRunner.query(`
      UPDATE users u
      SET 
        reset_password_token = prt.token_hash,
        reset_password_expires = prt.expires_at
      FROM password_reset_tokens prt
      WHERE u.id = prt.user_id
        AND prt.is_used = false
        AND prt.expires_at > NOW()
    `);

    // 4. Remover índices da tabela password_reset_tokens
    await queryRunner.dropIndex('password_reset_tokens', 'idx_password_reset_user_id');
    await queryRunner.dropIndex('password_reset_tokens', 'idx_password_reset_token_hash');
    await queryRunner.dropIndex('password_reset_tokens', 'idx_password_reset_expires_at');

    // 5. Remover foreign key
    const passwordResetTable = await queryRunner.getTable('password_reset_tokens');
    const foreignKey = passwordResetTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('password_reset_tokens', foreignKey);
    }

    // 6. Remover tabela password_reset_tokens
    await queryRunner.dropTable('password_reset_tokens');
  }
}

