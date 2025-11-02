import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, 
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      error: 'TOO_MANY_REQUESTS',
      retryAfter: '15 minutos'
    });
  }
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
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

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
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

export const submissionRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
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

