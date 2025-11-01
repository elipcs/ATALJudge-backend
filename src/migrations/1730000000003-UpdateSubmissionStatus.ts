import { MigrationInterface, QueryRunner } from 'typeorm';
import { logger } from '../utils';

export class UpdateSubmissionStatus1730000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se o ENUM existe e adicionar novos valores se necessário
    const newValues = [
      'accepted',
      'wrong_answer',
      'time_limit_exceeded',
      'compilation_error',
      'runtime_error'
    ];

    for (const value of newValues) {
      // Tentar adicionar cada valor ao ENUM (se não existir, será ignorado)
      try {
        await queryRunner.query(`
          ALTER TYPE submissions_status_enum ADD VALUE IF NOT EXISTS '${value}'
        `);
      } catch (error) {
        // Valor já existe, continuar
        logger.debug(`[MIGRATION] Valor '${value}' já existe no enum ou erro`, { error });
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Nota: PostgreSQL não permite remover valores de um ENUM diretamente
    // Para reverter, seria necessário recriar o ENUM e a coluna
    // Por simplicidade, não fazemos nada aqui
    logger.info('[MIGRATION] Reverter alterações de ENUM requer recriação do tipo, operação não suportada');
  }
}


