import winston from 'winston';
import { config } from '../config/environment';

/**
 * Níveis de log personalizados
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Cores para cada nível de log
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

/**
 * Formato de log para desenvolvimento
 */
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    let message = `${info.timestamp} [${info.level}]: ${info.message}`;
    
    // Adicionar objetos/metadados se existirem
    const meta: any = { ...info };
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;
    
    if (Object.keys(meta).length > 0) {
      message += ' ' + JSON.stringify(meta, null, 2);
    }
    
    return message;
  })
);

/**
 * Formato de log para produção (JSON)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Transportes (destinos dos logs)
 */
const transports: winston.transport[] = [
  // Console sempre habilitado
  new winston.transports.Console(),
];

// Em produção, também salva em arquivos
if (config.nodeEnv === 'production') {
  // Logs gerais
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Logs de erro
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Instância do logger Winston
 */
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  levels,
  format: config.nodeEnv === 'production' ? prodFormat : devFormat,
  transports,
  // Não sair do processo em caso de erro
  exitOnError: false,
});

/**
 * Logger configurado para o projeto
 * 
 * Uso:
 * import logger from './utils/logger';
 * 
 * logger.info('Mensagem de informação');
 * logger.error('Erro ocorreu', { error: err });
 * logger.warn('Aviso');
 * logger.debug('Debug info');
 */
export default logger;

