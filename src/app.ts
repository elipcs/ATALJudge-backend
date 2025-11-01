import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils';
import { errorHandler, notFoundHandler } from './middlewares';
import { container } from './config/di';

/**
 * Cria e configura a aplicação Express
 */
export function createApp(): Application {
  const app = express();

  // ========================================
  // MIDDLEWARES GLOBAIS
  // ========================================

  // Helmet - Segurança HTTP headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  }));

  // CORS - Configuração segura
  app.use(cors({
    origin: function (origin, callback) {
      // Em produção, ser rigoroso com origens
      const isProduction = config.nodeEnv === 'production';
      
      // Permitir requisições sem origin APENAS em desenvolvimento (mobile apps, Postman, etc.)
      if (!origin) {
        if (isProduction) {
          logger.warn('[CORS] Requisição sem origin bloqueada em produção');
          return callback(new Error('Origem não permitida'), false);
        }
        return callback(null, true);
      }
      
      // Lista de origens permitidas (do .env ou padrões de desenvolvimento)
      const allowedOrigins = config.allowedOrigins.length > 0
        ? config.allowedOrigins // Usar origens do .env se definidas
        : [ // Senão, usar padrões
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
          // Em desenvolvimento, apenas avisar mas permitir
          callback(null, true);
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 horas
  }));

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Tratamento de erro de JSON inválido
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

  // Rate limiting - Geral (moderado para não bloquear uso normal)
  const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // 60 requisições por minuto (1/segundo em média)
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', generalLimiter);
  
  // Rate limiters específicos são aplicados nos controllers
  // (auth: 5/15min, register: 3/hora, submissions: 10/min)

  // Logging de requisições
  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.path}`);
    next();
  });

  // ========================================
  // ROTAS
  // ========================================

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // API routes (usando container DI)
  app.use('/api/auth', container.authController);
  app.use('/api/users', container.userController);
  app.use('/api/invites', container.inviteController);
  app.use('/api/questions', container.questionController);
  app.use('/api/classes', container.classController);
  app.use('/api/submissions', container.submissionController);
  app.use('/api/lists', container.questionListController);
  app.use('/api/grades', container.gradeController);
  app.use('/api', container.testCaseController); // testcase usa prefixo /api com rotas aninhadas

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================

  // 404 - Rota não encontrada
  app.use(notFoundHandler);

  // Tratamento global de erros
  app.use(errorHandler);

  return app;
}

