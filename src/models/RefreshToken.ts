import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { TokenManager } from '../utils/TokenManager';

/**
 * Entidade RefreshToken - armazena tokens de refresh
 * 
 * SEGURANÇA:
 * - Token é hasheado (SHA256) antes de salvar
 * - Apenas o hash é armazenado no banco
 * - Token original só existe na resposta inicial
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // Hash do token (não o token em si)
  @Column({ name: 'token_hash', length: 64, unique: true })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  isRevoked!: boolean;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent?: string;

  // Identificador da família de tokens (para detectar roubo)
  @Column({ name: 'family_id', type: 'uuid', nullable: true })
  familyId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  // Última vez que foi usado
  @Column({ name: 'last_used_at', type: 'timestamp with time zone', nullable: true })
  lastUsedAt?: Date;

  // Relacionamentos
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /**
   * Define o token (armazena apenas o hash)
   */
  setToken(token: string): void {
    this.tokenHash = TokenManager.hashToken(token);
  }

  /**
   * Verifica se um token corresponde ao hash armazenado
   */
  matchesToken(token: string): boolean {
    return TokenManager.validateTokenHash(token, this.tokenHash);
  }

  /**
   * Verifica se o token está expirado
   */
  isExpired(): boolean {
    return TokenManager.isExpired(this.expiresAt);
  }

  /**
   * Verifica se o token é válido (não revogado e não expirado)
   */
  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  /**
   * Marca como usado (atualiza timestamp)
   */
  markAsUsed(): void {
    this.lastUsedAt = new Date();
  }
}
