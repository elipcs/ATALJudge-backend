import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex
} from 'typeorm';

export class InitializeDatabase1730000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      CREATE TYPE user_role_enum AS ENUM (
        'student',
        'professor',
        'assistant'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE programming_language_enum AS ENUM (
        'c',
        'cpp',
        'java',
        'python',
        'javascript',
        'typescript',
        'golang',
        'rust',
        'kotlin',
        'csharp'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE submissions_status_enum AS ENUM (
        'pending',
        'accepted',
        'wrong_answer',
        'time_limit_exceeded',
        'compilation_error',
        'runtime_error',
        'running'
      )
    `);

    // Create users table (base for inheritance)
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
            isNullable: false
          },
          {
            name: '_email',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'role',
            type: 'user_role_enum',
            default: `'student'`,
            isNullable: false
          },
          {
            name: 'last_login',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'class_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Create classes table
    await queryRunner.createTable(
      new Table({
        name: 'classes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'professor_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add class_id foreign key to users
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['class_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'classes',
        onDelete: 'SET NULL'
      })
    );

    // Add professor_id foreign key to classes
    await queryRunner.createForeignKey(
      'classes',
      new TableForeignKey({
        columnNames: ['professor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );

    // Create questions table
    await queryRunner.createTable(
      new Table({
        name: 'questions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false
          },
          {
            name: 'statement',
            type: 'text',
            isNullable: false
          },
          {
            name: 'input_format',
            type: 'text',
            default: `''`,
            isNullable: false
          },
          {
            name: 'output_format',
            type: 'text',
            default: `''`,
            isNullable: false
          },
          {
            name: 'constraints',
            type: 'text',
            default: `''`,
            isNullable: false
          },
          {
            name: 'notes',
            type: 'text',
            default: `''`,
            isNullable: false
          },
          {
            name: 'tags',
            type: 'text',
            default: `''`,
            isNullable: false
          },
          {
            name: 'author_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'time_limit_ms',
            type: 'int',
            default: 1000,
            isNullable: false
          },
          {
            name: 'memory_limit_kb',
            type: 'int',
            default: 64000,
            isNullable: false
          },
          {
            name: 'wall_time_limit_s',
            type: 'float',
            isNullable: true
          },
          {
            name: 'examples',
            type: 'jsonb',
            default: `'[]'`,
            isNullable: false
          },
          {
            name: 'submission_type',
            type: 'varchar',
            length: '20',
            default: `'local'`,
            isNullable: false
          },
          {
            name: 'contest_id',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'problem_index',
            type: 'varchar',
            length: '10',
            isNullable: true
          },
          {
            name: 'codeforces_link',
            type: 'varchar',
            length: '500',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add author_id foreign key to questions
    await queryRunner.createForeignKey(
      'questions',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL'
      })
    );

    // Create test_cases table
    await queryRunner.createTable(
      new Table({
        name: 'test_cases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'question_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'input',
            type: 'text',
            isNullable: false
          },
          {
            name: 'expected_output',
            type: 'text',
            isNullable: false
          },
          {
            name: 'is_sample',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign key for test_cases
    await queryRunner.createForeignKey(
      'test_cases',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE'
      })
    );

    // Create submissions table
    await queryRunner.createTable(
      new Table({
        name: 'submissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'question_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: '_code',
            type: 'text',
            isNullable: false
          },
          {
            name: 'language',
            type: 'programming_language_enum',
            isNullable: false
          },
          {
            name: 'status',
            type: 'submissions_status_enum',
            default: `'pending'`,
            isNullable: false
          },
          {
            name: '_score',
            type: 'int',
            default: 0,
            isNullable: false
          },
          {
            name: 'total_tests',
            type: 'int',
            default: 0,
            isNullable: false
          },
          {
            name: 'passed_tests',
            type: 'int',
            default: 0,
            isNullable: false
          },
          {
            name: 'execution_time_ms',
            type: 'int',
            isNullable: true
          },
          {
            name: 'memory_used_kb',
            type: 'int',
            isNullable: true
          },
          {
            name: 'verdict',
            type: 'text',
            isNullable: true
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign keys for submissions
    await queryRunner.createForeignKey(
      'submissions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'submissions',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE'
      })
    );

    // Create submission_results table
    await queryRunner.createTable(
      new Table({
        name: 'submission_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'submission_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'test_case_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'status',
            type: 'submissions_status_enum',
            isNullable: false
          },
          {
            name: 'execution_time_ms',
            type: 'int',
            isNullable: true
          },
          {
            name: 'memory_used_kb',
            type: 'int',
            isNullable: true
          },
          {
            name: 'output',
            type: 'text',
            isNullable: true
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign keys for submission_results
    await queryRunner.createForeignKey(
      'submission_results',
      new TableForeignKey({
        columnNames: ['submission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'submissions',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'submission_results',
      new TableForeignKey({
        columnNames: ['test_case_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'test_cases',
        onDelete: 'CASCADE'
      })
    );

    // Create grades table
    await queryRunner.createTable(
      new Table({
        name: 'grades',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'submission_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'question_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'value',
            type: 'float',
            isNullable: false
          },
          {
            name: 'graded_by',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'feedback',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign keys for grades
    await queryRunner.createForeignKey(
      'grades',
      new TableForeignKey({
        columnNames: ['submission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'submissions',
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createForeignKey(
      'grades',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'grades',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'grades',
      new TableForeignKey({
        columnNames: ['graded_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL'
      })
    );

    // Create refresh_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '64',
            isNullable: true,
            isUnique: true
          },
          {
            name: 'family_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: false
          },
          {
            name: 'last_used_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign key for refresh_tokens
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );

    // Create password_reset_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '64',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: false
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign key for password_reset_tokens
    await queryRunner.createForeignKey(
      'password_reset_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );

    // Create allowed_ips table
    await queryRunner.createTable(
      new Table({
        name: 'allowed_ips',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'ip',
            type: 'varchar',
            length: '45',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            onUpdate: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );

    // Create question_lists table
    await queryRunner.createTable(
      new Table({
        name: 'question_lists',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'author_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'start_date',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'end_date',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: `'draft'`,
            isNullable: false
          },
          {
            name: 'scoring_mode',
            type: 'varchar',
            length: '20',
            default: `'simple'`,
            isNullable: false
          },
          {
            name: 'max_score',
            type: 'int',
            default: 10,
            isNullable: false
          },
          {
            name: 'min_questions_for_max_score',
            type: 'int',
            isNullable: true
          },
          {
            name: 'question_groups',
            type: 'jsonb',
            default: `'[]'`,
            isNullable: false
          },
          {
            name: 'is_restricted',
            type: 'boolean',
            default: false,
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign key for question_lists
    await queryRunner.createForeignKey(
      'question_lists',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL'
      })
    );

    // Create question_list_questions table (junction table)
    await queryRunner.createTable(
      new Table({
        name: 'question_list_questions',
        columns: [
          {
            name: 'list_id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'question_id',
            type: 'uuid',
            isPrimary: true
          }
        ]
      }),
      true
    );

    // Add foreign keys for question_list_questions
    await queryRunner.createForeignKey(
      'question_list_questions',
      new TableForeignKey({
        columnNames: ['list_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'question_lists',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'question_list_questions',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE'
      })
    );

    // Create question_list_classes table (junction table)
    await queryRunner.createTable(
      new Table({
        name: 'question_list_classes',
        columns: [
          {
            name: 'list_id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'class_id',
            type: 'uuid',
            isPrimary: true
          }
        ]
      }),
      true
    );

    // Add foreign keys for question_list_classes
    await queryRunner.createForeignKey(
      'question_list_classes',
      new TableForeignKey({
        columnNames: ['list_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'question_lists',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'question_list_classes',
      new TableForeignKey({
        columnNames: ['class_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'classes',
        onDelete: 'CASCADE'
      })
    );

    // Create invites table
    await queryRunner.createTable(
      new Table({
        name: 'invites',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'class_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'used_by',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'used_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign keys for invites
    await queryRunner.createForeignKey(
      'invites',
      new TableForeignKey({
        columnNames: ['class_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'classes',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'invites',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'invites',
      new TableForeignKey({
        columnNames: ['used_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL'
      })
    );

    // Create token_blacklist table
    await queryRunner.createTable(
      new Table({
        name: 'token_blacklist',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '64',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Add foreign key for token_blacklist
    await queryRunner.createForeignKey(
      'token_blacklist',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE'
      })
    );

    // Create indices for performance
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_email',
        columnNames: ['_email']
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_class_id',
        columnNames: ['class_id']
      })
    );

    await queryRunner.createIndex(
      'classes',
      new TableIndex({
        name: 'idx_classes_professor',
        columnNames: ['professor_id']
      })
    );

    await queryRunner.createIndex(
      'classes',
      new TableIndex({
        name: 'idx_classes_active',
        columnNames: ['is_active']
      })
    );

    await queryRunner.createIndex(
      'classes',
      new TableIndex({
        name: 'idx_classes_professor_active',
        columnNames: ['professor_id', 'is_active']
      })
    );

    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'idx_questions_type',
        columnNames: ['submission_type']
      })
    );

    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'idx_questions_author',
        columnNames: ['author_id']
      })
    );

    await queryRunner.createIndex(
      'test_cases',
      new TableIndex({
        name: 'idx_test_cases_question',
        columnNames: ['question_id']
      })
    );

    await queryRunner.createIndex(
      'test_cases',
      new TableIndex({
        name: 'idx_test_cases_sample',
        columnNames: ['is_sample']
      })
    );

    await queryRunner.createIndex(
      'test_cases',
      new TableIndex({
        name: 'idx_test_cases_active',
        columnNames: ['is_active']
      })
    );

    await queryRunner.createIndex(
      'test_cases',
      new TableIndex({
        name: 'idx_test_cases_question_active',
        columnNames: ['question_id', 'is_active']
      })
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'idx_submissions_user',
        columnNames: ['user_id']
      })
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'idx_submissions_question',
        columnNames: ['question_id']
      })
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'idx_submissions_status',
        columnNames: ['status']
      })
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'idx_submissions_created',
        columnNames: ['created_at']
      })
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'idx_submissions_user_question',
        columnNames: ['user_id', 'question_id']
      })
    );

    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'idx_submissions_question_status',
        columnNames: ['question_id', 'status']
      })
    );

    await queryRunner.createIndex(
      'submission_results',
      new TableIndex({
        name: 'idx_submission_results_submission',
        columnNames: ['submission_id']
      })
    );

    await queryRunner.createIndex(
      'submission_results',
      new TableIndex({
        name: 'idx_submission_results_test_case',
        columnNames: ['test_case_id']
      })
    );

    await queryRunner.createIndex(
      'grades',
      new TableIndex({
        name: 'idx_grades_user',
        columnNames: ['user_id']
      })
    );

    await queryRunner.createIndex(
      'grades',
      new TableIndex({
        name: 'idx_grades_question',
        columnNames: ['question_id']
      })
    );

    await queryRunner.createIndex(
      'grades',
      new TableIndex({
        name: 'idx_grades_submission',
        columnNames: ['submission_id']
      })
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_user',
        columnNames: ['user_id']
      })
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_family',
        columnNames: ['family_id']
      })
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_expires',
        columnNames: ['expires_at']
      })
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_user_id',
        columnNames: ['user_id']
      })
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_token_hash',
        columnNames: ['token_hash']
      })
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new TableIndex({
        name: 'idx_password_reset_expires_at',
        columnNames: ['expires_at']
      })
    );

    await queryRunner.createIndex(
      'question_lists',
      new TableIndex({
        name: 'idx_question_lists_author',
        columnNames: ['author_id']
      })
    );

    await queryRunner.createIndex(
      'question_lists',
      new TableIndex({
        name: 'idx_question_lists_status',
        columnNames: ['status']
      })
    );

    await queryRunner.createIndex(
      'question_lists',
      new TableIndex({
        name: 'idx_question_lists_dates',
        columnNames: ['start_date', 'end_date']
      })
    );

    await queryRunner.createIndex(
      'question_list_questions',
      new TableIndex({
        name: 'idx_question_list_questions_list',
        columnNames: ['list_id']
      })
    );

    await queryRunner.createIndex(
      'question_list_questions',
      new TableIndex({
        name: 'idx_question_list_questions_question',
        columnNames: ['question_id']
      })
    );

    await queryRunner.createIndex(
      'question_list_classes',
      new TableIndex({
        name: 'idx_question_list_classes_list',
        columnNames: ['list_id']
      })
    );

    await queryRunner.createIndex(
      'question_list_classes',
      new TableIndex({
        name: 'idx_question_list_classes_class',
        columnNames: ['class_id']
      })
    );

    await queryRunner.createIndex(
      'invites',
      new TableIndex({
        name: 'idx_invites_token',
        columnNames: ['token']
      })
    );

    await queryRunner.createIndex(
      'invites',
      new TableIndex({
        name: 'idx_invites_class',
        columnNames: ['class_id']
      })
    );

    await queryRunner.createIndex(
      'token_blacklist',
      new TableIndex({
        name: 'idx_token_blacklist_hash',
        columnNames: ['token_hash']
      })
    );

    await queryRunner.createIndex(
      'token_blacklist',
      new TableIndex({
        name: 'idx_token_blacklist_user',
        columnNames: ['user_id']
      })
    );

    await queryRunner.createIndex(
      'token_blacklist',
      new TableIndex({
        name: 'idx_token_blacklist_expires',
        columnNames: ['expires_at']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order of creation (respecting foreign keys)
    
    // Drop junction and related tables first
    await queryRunner.dropTable('token_blacklist', true);
    await queryRunner.dropTable('invites', true);
    await queryRunner.dropTable('question_list_classes', true);
    await queryRunner.dropTable('question_list_questions', true);
    await queryRunner.dropTable('question_lists', true);
    await queryRunner.dropTable('allowed_ips', true);
    await queryRunner.dropTable('password_reset_tokens', true);
    await queryRunner.dropTable('refresh_tokens', true);

    // Drop entity tables with foreign keys
    await queryRunner.dropTable('grades', true);
    await queryRunner.dropTable('submission_results', true);
    await queryRunner.dropTable('submissions', true);
    await queryRunner.dropTable('test_cases', true);
    await queryRunner.dropTable('questions', true);
    await queryRunner.dropTable('classes', true);
    await queryRunner.dropTable('users', true);

    // Drop ENUM types
    await queryRunner.query('DROP TYPE IF EXISTS submissions_status_enum');
    await queryRunner.query('DROP TYPE IF EXISTS programming_language_enum');
    await queryRunner.query('DROP TYPE IF EXISTS user_role_enum');
  }
}
