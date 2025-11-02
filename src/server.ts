import 'reflect-metadata';
import { createApp } from './app';
import { config, validateConfig, initializeDatabase, closeDatabase } from './config';
import { logger } from './utils';

async function startServer() {
  try {
    logger.info('AtalJudge Backend - TypeScript');
    logger.info('================================\n');

    logger.info('Validando configurações...');
    validateConfig();
    logger.info('Configurações válidas\n');

    logger.info('Conectando ao banco de dados...');
    await initializeDatabase();
    logger.info('');

    logger.info('Criando aplicação Express...');
    const app = createApp();
    logger.info('Aplicação criada\n');

    const port = config.port;
    const server = app.listen(port, () => {
      logger.info('================================');
      logger.info(`Servidor rodando na porta ${port}`);
      logger.info(`URL: http://localhost:${port}`);
      logger.info(`Ambiente: ${config.nodeEnv}`);
      logger.info('================================\n');
    });

    const gracefulShutdown = async (signal: string) => {
      logger.warn(`\nSinal ${signal} recebido, encerrando servidor...`);
      
      server.close(async () => {
        logger.info('Servidor HTTP encerrado');
        
        await closeDatabase();
        
        logger.info('Servidor encerrado com sucesso');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Não foi possível encerrar graciosamente, forçando encerramento');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      const errorInfo = reason instanceof Error
        ? {
            message: reason.message,
            name: reason.name,
            stack: reason.stack,
            cause: reason.cause
          }
        : {
            reason: String(reason),
            type: typeof reason
          };
      
      logger.error('Unhandled Rejection', {
        ...errorInfo,
        promiseRejection: true
      });

      if (config.nodeEnv === 'production') {
        logger.error('Encerrando processo devido a unhandled rejection');
        process.exit(1);
      }
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Erro ao iniciar servidor', { error });
    process.exit(1);
  }
}

startServer();

