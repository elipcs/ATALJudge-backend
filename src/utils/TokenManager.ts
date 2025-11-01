import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { config } from '../config';
import { TokenError } from './errors';

/**
 * Interface do payload JWT
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Gerenciador de tokens (JWT + Refresh Token)
 * 
 * RESPONSABILIDADES:
 * - Geração de JWT (access + refresh)
 * - Verificação de JWT
 * - Hash de tokens (SHA256)
 * - Validações de expiração
 * 
 * NÃO FAZ:
 * - Persistência no banco
 * - Regras de negócio
 */
export class TokenManager {
  // ==================== GERAÇÃO DE JWT ====================
  
  /**
   * Gera access token JWT (curta duração)
   */
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(
      payload,
      config.jwt.secret,
      {
        expiresIn: config.jwt.accessExpires,
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }
    );
  }

  /**
   * Gera refresh token JWT (longa duração)
   */
  static generateRefreshToken(payload: JwtPayload): string {
    const token = jwt.sign(
      payload,
      config.jwt.secret, // Usa mesmo secret (mais simples e seguro)
      {
        expiresIn: config.jwt.refreshExpires,
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }
    );
    
    // Validação: JWT deve ter pelo menos 100 caracteres
    if (token.length < 100) {
      throw new Error(`Token gerado é muito curto: ${token.length} caracteres. Isso não é um JWT válido.`);
    }
    
    return token;
  }

  /**
   * Gera par de tokens (access + refresh)
   */
  static generateTokenPair(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  // ==================== VERIFICAÇÃO DE JWT ====================

  /**
   * Verifica e decodifica access token
   * @throws Error se token inválido ou expirado
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenError('Token expirado', 'ACCESS_TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenError(`Token inválido: ${error.message}`, 'INVALID_ACCESS_TOKEN');
      }
      throw new TokenError(`Erro ao verificar token: ${error instanceof Error ? error.message : String(error)}`, 'TOKEN_VERIFICATION_ERROR');
    }
  }

  /**
   * Verifica e decodifica refresh token
   * @throws Error se token inválido ou expirado
   */
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, { // Usa mesmo secret
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenError('Refresh token expirado', 'REFRESH_TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenError(`Refresh token inválido: ${error.message}`, 'INVALID_REFRESH_TOKEN');
      }
      throw new TokenError(`Erro ao verificar refresh token: ${error instanceof Error ? error.message : String(error)}`, 'TOKEN_VERIFICATION_ERROR');
    }
  }

  /**
   * Verifica token (tenta como access, depois refresh)
   * Mantido para compatibilidade
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return this.verifyAccessToken(token);
    } catch {
      return this.verifyRefreshToken(token);
    }
  }

  // ==================== HASH DE TOKENS ====================

  /**
   * Gera hash SHA256 de um token
   * Usado para armazenar refresh tokens com segurança
   */
  static hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Verifica se um token corresponde ao hash armazenado
   */
  static validateTokenHash(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);
    return tokenHash === hash;
  }

  // ==================== VALIDAÇÕES ====================

  /**
   * Verifica se uma data de expiração já passou
   */
  static isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Calcula data de expiração baseado em segundos
   */
  static calculateExpirationDate(secondsFromNow: number): Date {
    return new Date(Date.now() + secondsFromNow * 1000);
  }

  /**
   * Extrai informações do token sem verificar assinatura
   * ATENÇÃO: Apenas para logging/debug, não usar para autenticação!
   */
  static decodeWithoutVerify(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se token está próximo de expirar (útil para renovação automática)
   * @param token Token JWT
   * @param thresholdSeconds Quantos segundos antes de expirar (padrão: 300 = 5 minutos)
   */
  static isAboutToExpire(token: string, thresholdSeconds: number = 300): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return false;

      const expirationTime = decoded.exp * 1000; // Converter para milissegundos
      const timeUntilExpiration = expirationTime - Date.now();
      
      return timeUntilExpiration <= (thresholdSeconds * 1000);
    } catch {
      return false;
    }
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Gera um ID único para família de tokens (usado em token rotation)
   */
  static generateFamilyId(): string {
    return crypto.randomUUID();
  }

  /**
   * Extrai bearer token do header Authorization
   */
  static extractBearerToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }

  /**
   * Valida formato básico de JWT (sem verificar assinatura)
   */
  static isValidJwtFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }
}

