/**
 * Payload Converter Middleware Module
 * 
 * Provides middleware for normalizing and converting request payloads.
 * Handles type conversions for request bodies from different sources.
 * 
 * @module middlewares/payload-converter
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';

/**
 * Parses time limit strings or numbers into milliseconds
 * 
 * Supports formats: 'ms', 's', or plain number
 * 
 * @function parseTimeLimit
 * @param {string | number} limit - Time limit value
 * @returns {number} Time limit in milliseconds
 * @example
 * parseTimeLimit('2s') // returns 2000
 * parseTimeLimit('500ms') // returns 500
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

  return parseInt(limitStr);
}

/**
 * Parses memory limit strings or numbers into kilobytes
 * 
 * Supports formats: 'kb', 'mb', 'gb', or plain number
 * 
 * @function parseMemoryLimit
 * @param {string | number} limit - Memory limit value
 * @returns {number} Memory limit in kilobytes
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

  return parseInt(limitStr);
}

export function convertQuestionPayload(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    // Convert statement to text for backward compatibility
    if (req.body.statement !== undefined && req.body.text === undefined) {
      req.body.text = req.body.statement;
      delete req.body.statement;
    }

    if (req.body.timeLimit !== undefined) {
      try {
        req.body.timeLimitMs = parseTimeLimit(req.body.timeLimit);
        delete req.body.timeLimit;
      } catch (error) {

        logger.warn('[PAYLOAD] Erro ao converter timeLimit', { error });
      }
    }

    if (req.body.memoryLimit !== undefined) {
      try {
        req.body.memoryLimitKb = parseMemoryLimit(req.body.memoryLimit);
        delete req.body.memoryLimit;
      } catch (error) {

        logger.warn('[PAYLOAD] Erro ao converter memoryLimit', { error });
      }
    }

  }

  next();
}

export function convertQuestionResponse(data: any): any {
  if (!data) return data;

  return {
    ...data,
    timeLimit: data.timeLimitMs ? `${data.timeLimitMs}ms` : undefined,
    memoryLimit: data.memoryLimitKb ? `${data.memoryLimitKb}KB` : undefined
  };
}

export function convertUserRegisterPayload(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {

    if (req.body.token !== undefined && req.body.inviteToken === undefined) {
      req.body.inviteToken = req.body.token;
      delete req.body.token;
    }

    if (req.body.student_registration !== undefined) {
      req.body.studentRegistration = req.body.student_registration;
      delete req.body.student_registration;
    }

    if (req.body.class_id !== undefined) {
      req.body.classId = req.body.class_id;
      delete req.body.class_id;
    }

    if (req.body.class_name !== undefined) {
      req.body.className = req.body.class_name;
      delete req.body.class_name;
    }
  }

  next();
}

