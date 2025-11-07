/**
 * Token Manager Module
 * 
 * Handles JWT token generation, verification, and management for the authentication system.
 * Provides methods for generating access and refresh token pairs, verifying tokens,
 * and managing token lifecycle with proper error handling.
 * 
 * @module utils/TokenManager
 */

import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { config } from '../config';
import { TokenError } from './errors';

/**
 * JWT Payload interface
 * 
 * Represents the payload structure for JWT tokens used in authentication.
 * Includes user identification, token metadata, and standard JWT claims.
 * 
 * @interface JwtPayload
 * @property {string} sub - Subject claim containing the user ID
 * @property {string} [jti] - JWT ID, unique identifier for this token instance
 * @property {'access' | 'refresh'} [tokenType] - Type of token (access or refresh)
 * @property {string} email - User email address
 * @property {string} role - User role for authorization
 * @property {number} [iat] - Issued at time (seconds since epoch)
 * @property {number} [exp] - Expiration time (seconds since epoch)
 * @property {number} [nbf] - Not before time (seconds since epoch)
 */
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

/**
 * Token Manager Class
 * 
 * Provides static methods for token generation, verification, and validation.
 * Manages both access and refresh tokens with proper expiration and type validation.
 * 
 * @class TokenManager
 */
export class TokenManager {

  /**
   * Generate Access Token
   * 
   * Creates a new access token with the provided payload.
   * Access tokens are short-lived tokens used for authenticated API requests.
   * 
   * @static
   * @param {JwtPayload} payload - JWT payload containing user information
   * @returns {string} Signed JWT access token
   * @throws {Error} If token generation fails
   * 
   * @example
   * const payload: JwtPayload = {
   *   sub: 'user-123',
   *   email: 'user@example.com',
   *   role: 'STUDENT'
   * };
   * const accessToken = TokenManager.generateAccessToken(payload);
   */
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

  /**
   * Generate Refresh Token
   * 
   * Creates a new refresh token with the provided payload.
   * Refresh tokens are long-lived tokens used to obtain new access tokens.
   * Validates that generated token meets minimum length requirements for valid JWT.
   * 
   * @static
   * @param {JwtPayload} payload - JWT payload containing user information
   * @returns {string} Signed JWT refresh token
   * @throws {Error} If token is too short or generation fails
   * 
   * @example
   * const payload: JwtPayload = {
   *   sub: 'user-123',
   *   email: 'user@example.com',
   *   role: 'STUDENT'
   * };
   * const refreshToken = TokenManager.generateRefreshToken(payload);
   */
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
      throw new Error(`Generated token is too short: ${token.length} characters. This is not a valid JWT.`);
    }
    
    return token;
  }

  /**
   * Generate Token Pair
   * 
   * Creates both access and refresh tokens for a new authentication session.
   * Returns a pair of tokens suitable for client storage and use.
   * 
   * @static
   * @param {JwtPayload} payload - JWT payload containing user information
   * @returns {Object} Object containing accessToken and refreshToken
   * @returns {string} returns.accessToken - Signed JWT access token
   * @returns {string} returns.refreshToken - Signed JWT refresh token
   * 
   * @example
   * const payload: JwtPayload = {
   *   sub: 'user-123',
   *   email: 'user@example.com',
   *   role: 'STUDENT'
   * };
   * const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);
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

  /**
   * Verify Access Token
   * 
   * Validates and decodes an access token, ensuring it is properly signed,
   * not expired, and has the correct token type. Extracts and returns the payload.
   * 
   * @static
   * @param {string} token - The JWT access token to verify
   * @returns {JwtPayload} Decoded JWT payload
   * @throws {TokenError} If token is invalid, expired, or not of type 'access'
   * 
   * @example
   * try {
   *   const payload = TokenManager.verifyAccessToken(token);
   *   console.log('User ID:', payload.sub);
   * } catch (error) {
   *   console.error('Invalid token:', error.message);
   * }
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }) as JwtPayload;

      if (decoded.tokenType && decoded.tokenType !== 'access') {
        throw new TokenError('Invalid token type for access token', 'INVALID_TOKEN_TYPE');
      }

      if (!decoded.sub || typeof decoded.sub !== 'string') {
        throw new TokenError('Invalid access token: subject missing', 'INVALID_TOKEN_PAYLOAD');
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
        throw new TokenError('Token expired', 'ACCESS_TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenError(`Invalid token: ${error.message}`, 'INVALID_ACCESS_TOKEN');
      }
      throw new TokenError(`Error verifying token: ${error instanceof Error ? error.message : String(error)}`, 'TOKEN_VERIFICATION_ERROR');
    }
  }

  /**
   * Verify Refresh Token
   * 
   * Validates and decodes a refresh token, ensuring it is properly signed,
   * not expired, and has the correct token type. Used when refreshing access tokens.
   * 
   * @static
   * @param {string} token - The JWT refresh token to verify
   * @returns {JwtPayload} Decoded JWT payload
   * @throws {TokenError} If token is invalid, expired, or not of type 'refresh'
   * 
   * @example
   * try {
   *   const payload = TokenManager.verifyRefreshToken(refreshToken);
   *   // Use payload to generate new access token
   * } catch (error) {
   *   console.error('Refresh token invalid:', error.message);
   * }
   */
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, { 
        issuer: 'ataljudge',
        audience: 'ataljudge-api'
      }) as JwtPayload;

      if (decoded.tokenType && decoded.tokenType !== 'refresh') {
        throw new TokenError('Invalid token type for refresh token', 'INVALID_TOKEN_TYPE');
      }

      if (!decoded.sub || typeof decoded.sub !== 'string') {
        throw new TokenError('Invalid refresh token: subject missing', 'INVALID_TOKEN_PAYLOAD');
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
        throw new TokenError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenError(`Invalid refresh token: ${error.message}`, 'INVALID_REFRESH_TOKEN');
      }
      throw new TokenError(`Error verifying refresh token: ${error instanceof Error ? error.message : String(error)}`, 'TOKEN_VERIFICATION_ERROR');
    }
  }

  /**
   * Verify Token
   * 
   * Generic token verification method that attempts to verify as an access token first,
   * and falls back to refresh token verification if access verification fails.
   * 
   * @static
   * @param {string} token - The JWT token to verify (access or refresh)
   * @returns {JwtPayload} Decoded JWT payload
   * @throws {TokenError} If both access and refresh token verification fail
   * 
   * @example
   * try {
   *   const payload = TokenManager.verifyToken(token);
   *   console.log('Token user:', payload.sub);
   * } catch (error) {
   *   console.error('Token verification failed:', error.message);
   * }
   */
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

