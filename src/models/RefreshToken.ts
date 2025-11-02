import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { TokenManager } from '../utils/TokenManager';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

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

  @Column({ name: 'family_id', type: 'uuid', nullable: true })
  familyId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamp with time zone', nullable: true })
  lastUsedAt?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  setToken(token: string): void {
    this.tokenHash = TokenManager.hashToken(token);
  }

  matchesToken(token: string): boolean {
    return TokenManager.validateTokenHash(token, this.tokenHash);
  }

  isExpired(): boolean {
    return TokenManager.isExpired(this.expiresAt);
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  markAsUsed(): void {
    this.lastUsedAt = new Date();
  }
}
