import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddClassIndexes1730000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar índices para melhorar performance de queries em classes
    
    // Índice por professor_id
    await queryRunner.createIndex('classes', new TableIndex({
      name: 'idx_classes_professor',
      columnNames: ['professor_id']
    }));

    // Índice por is_active
    await queryRunner.createIndex('classes', new TableIndex({
      name: 'idx_classes_active',
      columnNames: ['is_active']
    }));

    // Índice composto para queries comuns
    await queryRunner.createIndex('classes', new TableIndex({
      name: 'idx_classes_professor_active',
      columnNames: ['professor_id', 'is_active']
    }));

    // Criar índices na tabela de relacionamento class_students
    const classStudentsTable = await queryRunner.getTable('class_students');
    if (classStudentsTable) {
      await queryRunner.createIndex('class_students', new TableIndex({
        name: 'idx_class_students_class',
        columnNames: ['class_id']
      }));

      await queryRunner.createIndex('class_students', new TableIndex({
        name: 'idx_class_students_student',
        columnNames: ['student_id']
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('classes', 'idx_classes_professor');
    await queryRunner.dropIndex('classes', 'idx_classes_active');
    await queryRunner.dropIndex('classes', 'idx_classes_professor_active');

    const classStudentsTable = await queryRunner.getTable('class_students');
    if (classStudentsTable) {
      await queryRunner.dropIndex('class_students', 'idx_class_students_class');
      await queryRunner.dropIndex('class_students', 'idx_class_students_student');
    }
  }
}


