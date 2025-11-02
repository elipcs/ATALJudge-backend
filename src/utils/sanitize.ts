

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'accessToken',
  'resetToken',
  'secret',
  'apiKey',
  'privateKey',
  'creditCard',
  'cvv',
  'ssn'
];

export function sanitizeForLog(obj: any, replacement: string = '[REDACTED]'): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLog(item, replacement));
  }

  const sanitized: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();

      const isSensitive = SENSITIVE_FIELDS.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = replacement;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        
        sanitized[key] = sanitizeForLog(obj[key], replacement);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
}

export function sanitizeUserForLog(user: any): any {
  if (!user) return user;
  
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

export function sanitizeHeaders(headers: any): any {
  if (!headers) return headers;

  const sanitized = { ...headers };
  
  if (sanitized.authorization) {
    sanitized.authorization = '[REDACTED]';
  }
  
  if (sanitized.cookie) {
    sanitized.cookie = '[REDACTED]';
  }

  return sanitized;
}

