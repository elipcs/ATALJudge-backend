#!/usr/bin/env node

/**
 * Script de teste para o sistema de fila de submissões
 * 
 * Uso:
 *   npm run test:queue
 * 
 * Requisitos:
 *   - Redis rodando em localhost:6379
 *   - REDIS_ENABLED=true no .env
 */

import 'reflect-metadata';
import { DIContainer } from './config';
import { logger } from './utils';

async function testQueue() {
  try {
    logger.info('=== Teste do Sistema de Fila ===\n');

    const container = DIContainer.getInstance();
    const queueService = container.submissionQueueService;

    if (!queueService) {
      logger.error('Sistema de fila não está habilitado!');
      logger.error('Configure REDIS_ENABLED=true no arquivo .env');
      process.exit(1);
    }

    logger.info('✓ Sistema de fila está habilitado\n');

    // Teste 1: Estatísticas da fila
    logger.info('Teste 1: Obtendo estatísticas da fila...');
    const stats = await queueService.getQueueStats();
    logger.info('Estatísticas:', stats);
    logger.info('');

    // Teste 2: Adicionar job de teste
    logger.info('Teste 2: Adicionando job de teste à fila...');
    const testSubmissionId = `test-${Date.now()}`;
    
    try {
      await queueService.addSubmissionToQueue(testSubmissionId);
      logger.info(`✓ Job de teste adicionado: ${testSubmissionId}\n`);
    } catch (error) {
      logger.error('✗ Erro ao adicionar job:', error);
    }

    // Teste 3: Verificar status do job
    logger.info('Teste 3: Verificando status do job...');
    setTimeout(async () => {
      const jobStatus = await queueService.getJobStatus(testSubmissionId);
      logger.info('Status do job:', jobStatus);
      logger.info('');

      // Teste 4: Estatísticas atualizadas
      logger.info('Teste 4: Estatísticas atualizadas...');
      const updatedStats = await queueService.getQueueStats();
      logger.info('Estatísticas:', updatedStats);
      logger.info('');

      logger.info('=== Testes Concluídos ===');
      logger.info('\nNota: O job de teste falhará pois a submissão não existe no banco.');
      logger.info('Isso é esperado. O objetivo é testar a infraestrutura da fila.\n');
      
      await queueService.close();
      process.exit(0);
    }, 2000);

  } catch (error) {
    logger.error('Erro durante os testes:', error);
    process.exit(1);
  }
}

testQueue();
