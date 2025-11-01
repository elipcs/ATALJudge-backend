import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import * as crypto from 'crypto';

/**
 * Entidade PasswordResetToken - armazena tokens de reset de senha
 * 
 * SEGURANÇA:
 * - Token é hasheado (SHA256) antes de salvar
 * - Apenas o hash é armazenado no banco
 * - Token original só existe na resposta inicial e no email
 */
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // Hash do token (não o token em si)
  @Column({ name: 'token_hash', length: 64, unique: true })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  // Relacionamentos
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /**
   * Define o token (armazena apenas o hash)
   */
  setToken(token: string): void {
    this.tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Verifica se um token corresponde ao hash armazenado
   */
  matchesToken(token: string): boolean {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    return this.tokenHash === hashedToken;
  }

  /**
   * Verifica se o token está expirado
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Verifica se o token é válido (não usado e não expirado)
   */
  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }

  /**
   * Marca como usado
   */
  markAsUsed(): void {
    this.isUsed = true;
  }
}

