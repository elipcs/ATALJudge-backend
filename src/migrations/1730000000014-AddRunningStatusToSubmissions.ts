import { MigrationInterface, QueryRunner } from 'typeorm';
import { logger } from '../utils';

export class AddRunningStatusToSubmissions1730000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    logger.info('[MIGRATION] Adicionando valor "running" ao enum submissions_status_enum');
    
    try {
      await queryRunner.query(`
        ALTER TYPE submissions_status_enum ADD VALUE IF NOT EXISTS 'running'
      `);
      logger.info('[MIGRATION] Valor "running" adicionado com sucesso ao enum');
    } catch (error) {
      logger.debug('[MIGRATION] Valor "running" já existe no enum ou erro', { error });
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Reverter alterações de ENUM requer recriação do tipo, operação não suportada
    logger.info('[MIGRATION] Reverter alterações de ENUM requer recriação do tipo, operação não suportada');
  }
}
