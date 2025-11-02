import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils';
import { errorHandler, notFoundHandler } from './middlewares';
import { container } from './config/di';

export function createApp(): Application {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  }));

  app.use(cors({
    origin: function (origin, callback) {
      
      const isProduction = config.nodeEnv === 'production';

      if (!origin) {
        if (isProduction) {
          logger.warn('[CORS] Requisição sem origin bloqueada em produção');
          return callback(new Error('Origem não permitida'), false);
        }
        return callback(null, true);
      }

      const allowedOrigins = config.allowedOrigins.length > 0
        ? config.allowedOrigins 
        : [ 
            config.frontendUrl,
            ...(!isProduction ? [
              'http://localhost:3000',
              'http://localhost:5173',
              'http://localhost:5174',
              'http://127.0.0.1:3000',
              'http://127.0.0.1:5173',
              'http://127.0.0.1:5174'
            ] : [])
          ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('[CORS] Origem bloqueada', { origin, isProduction });
        if (isProduction) {
          callback(new Error('Origem não permitida'), false);
        } else {
          
          callback(null, true);
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      logger.error('[JSON] JSON inválido recebido', { error: err });
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos - JSON malformado',
        error: 'INVALID_JSON'
      });
    }
    return next(err);
  });

  const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 100, 
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', generalLimiter);

  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.path}`);
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.use('/api/auth', container.authController);
  app.use('/api/users', container.userController);
  app.use('/api/invites', container.inviteController);
  app.use('/api/questions', container.questionController);
  app.use('/api/classes', container.classController);
  app.use('/api/submissions', container.submissionController);
  app.use('/api/lists', container.questionListController);
  app.use('/api/grades', container.gradeController);
  app.use('/api/config', container.configController);
  app.use('/api', container.testCaseController); 

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}

