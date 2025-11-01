import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateQuestionLists1730000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela question_lists
    await queryRunner.createTable(new Table({
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
          default: "'draft'",
          isNullable: false
        },
        {
          name: 'scoring_mode',
          type: 'varchar',
          length: '20',
          default: "'simple'",
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
          default: "'[]'",
          isNullable: false
        },
        {
          name: 'is_restricted',
          type: 'boolean',
          default: false,
          isNullable: false
        }
      ]
    }), true);

    // Adicionar foreign key para author_id
    await queryRunner.createForeignKey('question_lists', new TableForeignKey({
      columnNames: ['author_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'SET NULL'
    }));

    // Criar tabela de relacionamento question_list_questions
    await queryRunner.createTable(new Table({
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
    }), true);

    // Adicionar foreign keys
    await queryRunner.createForeignKey('question_list_questions', new TableForeignKey({
      columnNames: ['list_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'question_lists',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('question_list_questions', new TableForeignKey({
      columnNames: ['question_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'questions',
      onDelete: 'CASCADE'
    }));

    // Criar tabela de relacionamento question_list_classes
    await queryRunner.createTable(new Table({
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
    }), true);

    // Adicionar foreign keys
    await queryRunner.createForeignKey('question_list_classes', new TableForeignKey({
      columnNames: ['list_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'question_lists',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('question_list_classes', new TableForeignKey({
      columnNames: ['class_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'classes',
      onDelete: 'CASCADE'
    }));

    // Criar índices para performance
    await queryRunner.createIndex('question_lists', new TableIndex({
      name: 'idx_question_lists_author',
      columnNames: ['author_id']
    }));

    await queryRunner.createIndex('question_lists', new TableIndex({
      name: 'idx_question_lists_status',
      columnNames: ['status']
    }));

    await queryRunner.createIndex('question_lists', new TableIndex({
      name: 'idx_question_lists_dates',
      columnNames: ['start_date', 'end_date']
    }));

    await queryRunner.createIndex('question_list_questions', new TableIndex({
      name: 'idx_question_list_questions_list',
      columnNames: ['list_id']
    }));

    await queryRunner.createIndex('question_list_questions', new TableIndex({
      name: 'idx_question_list_questions_question',
      columnNames: ['question_id']
    }));

    await queryRunner.createIndex('question_list_classes', new TableIndex({
      name: 'idx_question_list_classes_list',
      columnNames: ['list_id']
    }));

    await queryRunner.createIndex('question_list_classes', new TableIndex({
      name: 'idx_question_list_classes_class',
      columnNames: ['class_id']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabelas de relacionamento
    await queryRunner.dropTable('question_list_classes', true);
    await queryRunner.dropTable('question_list_questions', true);
    
    // Remover tabela principal
    await queryRunner.dropTable('question_lists', true);
  }
}


