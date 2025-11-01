import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';

/**
 * Converte string de tempo para milissegundos
 * Ex: "1s" → 1000, "2000ms" → 2000, "1.5s" → 1500
 */
function parseTimeLimit(limit: string | number): number {
  if (typeof limit === 'number') return limit;
  
  const limitStr = limit.toString().toLowerCase().trim();
  
  if (limitStr.endsWith('ms')) {
    return parseInt(limitStr);
  }
  
  if (limitStr.endsWith('s')) {
    return parseFloat(limitStr) * 1000;
  }
  
  // Assumir que é um número em ms
  return parseInt(limitStr);
}

/**
 * Converte string de memória para kilobytes
 * Ex: "64MB" → 64000, "128KB" → 128, "1GB" → 1000000
 */
function parseMemoryLimit(limit: string | number): number {
  if (typeof limit === 'number') return limit;
  
  const limitStr = limit.toString().toUpperCase().trim();
  
  if (limitStr.endsWith('KB')) {
    return parseInt(limitStr);
  }
  
  if (limitStr.endsWith('MB')) {
    return parseInt(limitStr) * 1000;
  }
  
  if (limitStr.endsWith('GB')) {
    return parseInt(limitStr) * 1000000;
  }
  
  // Assumir que é um número em KB
  return parseInt(limitStr);
}

/**
 * Middleware para converter payload de questão do formato frontend para backend
 * Converte:
 * - input_format → inputFormat
 * - output_format → outputFormat
 * - timeLimit (string) → timeLimitMs (number)
 * - memoryLimit (string) → memoryLimitKb (number)
 */
export function convertQuestionPayload(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    // Converter nomenclatura snake_case → camelCase
    if (req.body.input_format !== undefined) {
      req.body.inputFormat = req.body.input_format;
      delete req.body.input_format;
    }
    
    if (req.body.output_format !== undefined) {
      req.body.outputFormat = req.body.output_format;
      delete req.body.output_format;
    }
    
    // Converter timeLimit string → timeLimitMs number
    if (req.body.timeLimit !== undefined) {
      try {
        req.body.timeLimitMs = parseTimeLimit(req.body.timeLimit);
        delete req.body.timeLimit;
      } catch (error) {
        // Se falhar, manter valor original
        logger.warn('[PAYLOAD] Erro ao converter timeLimit', { error });
      }
    }
    
    // Converter memoryLimit string → memoryLimitKb number
    if (req.body.memoryLimit !== undefined) {
      try {
        req.body.memoryLimitKb = parseMemoryLimit(req.body.memoryLimit);
        delete req.body.memoryLimit;
      } catch (error) {
        // Se falhar, manter valor original
        logger.warn('[PAYLOAD] Erro ao converter memoryLimit', { error });
      }
    }
    
    // Converter judgeType se necessário
    if (req.body.judgeType === undefined && req.body.judge_type !== undefined) {
      req.body.judgeType = req.body.judge_type;
      delete req.body.judge_type;
    }

    // Converter campos do Codeforces
    if (req.body.codeforcesContestId !== undefined) {
      req.body.contestId = req.body.codeforcesContestId;
      delete req.body.codeforcesContestId;
    }

    if (req.body.codeforcesProblemIndex !== undefined) {
      req.body.problemIndex = req.body.codeforcesProblemIndex;
      delete req.body.codeforcesProblemIndex;
    }
  }
  
  next();
}

/**
 * Middleware para converter payload de resposta de questão do backend para frontend
 * Adiciona campos com nomenclatura alternativa para compatibilidade
 */
export function convertQuestionResponse(data: any): any {
  if (!data) return data;
  
  return {
    ...data,
    // Adicionar versões snake_case para compatibilidade
    input_format: data.inputFormat,
    output_format: data.outputFormat,
    // Converter números para strings se necessário
    timeLimit: data.timeLimitMs ? `${data.timeLimitMs}ms` : undefined,
    memoryLimit: data.memoryLimitKb ? `${data.memoryLimitKb}KB` : undefined
  };
}

/**
 * Middleware para converter payload de usuário (register)
 * Aceita tanto inviteToken quanto campos individuais do frontend
 */
export function convertUserRegisterPayload(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    // Converter token → inviteToken (compatibilidade)
    if (req.body.token !== undefined && req.body.inviteToken === undefined) {
      req.body.inviteToken = req.body.token;
      delete req.body.token;
    }
    
    // Converter student_registration → studentRegistration
    if (req.body.student_registration !== undefined) {
      req.body.studentRegistration = req.body.student_registration;
      delete req.body.student_registration;
    }
    
    // Converter class_id → classId
    if (req.body.class_id !== undefined) {
      req.body.classId = req.body.class_id;
      delete req.body.class_id;
    }
    
    // Converter class_name → className
    if (req.body.class_name !== undefined) {
      req.body.className = req.body.class_name;
      delete req.body.class_name;
    }
  }
  
  next();
}

