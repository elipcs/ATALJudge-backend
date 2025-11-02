import winston from 'winston';
import { config } from '../config/environment';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    let message = `${info.timestamp} [${info.level}]: ${info.message}`;

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

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  
  new winston.transports.Console(),
];

if (config.nodeEnv === 'production') {
  
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, 
      maxFiles: 5,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  levels,
  format: config.nodeEnv === 'production' ? prodFormat : devFormat,
  transports,
  
  exitOnError: false,
});

export default logger;

