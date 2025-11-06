import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { config } from '../config';
import { TokenError } from './errors';

export interface JwtPayload {
  sub: string;
  jti?: string;
  tokenType?: 'access' | 'refresh';
  email: string;
  role: string;
  iat?: number; 
  exp?: number;
  nbf?: number;
}

export class TokenManager {

  static generateAccessToken(payload: JwtPayload): string {
    const tokenId = crypto.randomBytes(16).toString('hex');
    
    return jwt.sign(
      {
        sub: payload.sub, 
        email: payload.email,
        role: payload.role,
        jti: tokenId,
        tokenType: 'access' as const
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.accessExpires,
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }
    );
  }

  static generateRefreshToken(payload: JwtPayload): string {
    const tokenId = crypto.randomBytes(16).toString('hex');
    
    const token = jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        jti: tokenId,
        tokenType: 'refresh' as const
      },
      config.jwt.secret, 
      {
        expiresIn: config.jwt.refreshExpires,
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }
    );

    if (token.length < 100) {
      throw new Error(`Token gerado é muito curto: ${token.length} caracteres. Isso não é um JWT válido.`);
    }
    
    return token;
  }

  static generateTokenPair(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }) as JwtPayload;

      if (decoded.tokenType && decoded.tokenType !== 'access') {
        throw new TokenError('Tipo de token inválido para access token', 'INVALID_TOKEN_TYPE');
      }

      if (!decoded.sub || typeof decoded.sub !== 'string') {
        throw new TokenError('Access token inválido: subject ausente', 'INVALID_TOKEN_PAYLOAD');
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      if (error instanceof TokenError) {
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenError('Token expirado', 'ACCESS_TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenError(`Token inválido: ${error.message}`, 'INVALID_ACCESS_TOKEN');
      }
      throw new TokenError(`Erro ao verificar token: ${error instanceof Error ? error.message : String(error)}`, 'TOKEN_VERIFICATION_ERROR');
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, { 
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }) as JwtPayload;

      if (decoded.tokenType && decoded.tokenType !== 'refresh') {
        throw new TokenError('Tipo de token inválido para refresh token', 'INVALID_TOKEN_TYPE');
      }

      if (!decoded.sub || typeof decoded.sub !== 'string') {
        throw new TokenError('Refresh token inválido: subject ausente', 'INVALID_TOKEN_PAYLOAD');
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      if (error instanceof TokenError) {
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenError('Refresh token expirado', 'REFRESH_TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenError(`Refresh token inválido: ${error.message}`, 'INVALID_REFRESH_TOKEN');
      }
      throw new TokenError(`Erro ao verificar refresh token: ${error instanceof Error ? error.message : String(error)}`, 'TOKEN_VERIFICATION_ERROR');
    }
  }

  static verifyToken(token: string): JwtPayload {
    try {
      return this.verifyAccessToken(token);
    } catch {
      return this.verifyRefreshToken(token);
    }
  }

  static hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  static validateTokenHash(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);
    return tokenHash === hash;
  }

  static isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  static calculateExpirationDate(secondsFromNow: number): Date {
    return new Date(Date.now() + secondsFromNow * 1000);
  }

  static decodeWithoutVerify(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  static isAboutToExpire(token: string, thresholdSeconds: number = 300): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return false;

      const expirationTime = decoded.exp * 1000; 
      const timeUntilExpiration = expirationTime - Date.now();
      
      return timeUntilExpiration <= (thresholdSeconds * 1000);
    } catch {
      return false;
    }
  }

  static generateFamilyId(): string {
    return crypto.randomUUID();
  }

  static extractBearerToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }

  static isValidJwtFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }
}

