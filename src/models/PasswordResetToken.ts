import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import * as crypto from 'crypto';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'token_hash', length: 64, unique: true })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  setToken(token: string): void {
    this.tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  matchesToken(token: string): boolean {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    return this.tokenHash === hashedToken;
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }

  markAsUsed(): void {
    this.isUsed = true;
  }
}

