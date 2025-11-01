import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para autenticação (login/refresh)
 * RIGOROSO: 5 tentativas por 15 minutos
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 5 tentativas por 15 minutos
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Contar também requisições bem-sucedidas
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      error: 'TOO_MANY_REQUESTS',
      retryAfter: '15 minutos'
    });
  }
});

/**
 * Rate limiter para registro
 * RIGOROSO: 3 registros por hora
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora por IP
  message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
      error: 'TOO_MANY_REQUESTS',
      retryAfter: '1 hora'
    });
  }
});

/**
 * Rate limiter para recuperação de senha
 * MODERADO: 3 tentativas por hora
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 tentativas por hora
  message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.',
      error: 'TOO_MANY_REQUESTS',
      retryAfter: '1 hora'
    });
  }
});

/**
 * Rate limiter para submissões de código
 * MODERADO: 10 submissões por minuto
 */
export const submissionRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 submissões por minuto
  message: 'Muitas submissões. Aguarde um momento.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas submissões. Aguarde um momento antes de tentar novamente.',
      error: 'TOO_MANY_REQUESTS',
      retryAfter: '1 minuto'
    });
  }
});

