import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserRole } from '../enums';
import { User } from './User';
import { Class } from './Class';

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role!: UserRole;

  @Column({ length: 500, unique: true, nullable: false })
  token!: string;

  @Column({ name: 'max_uses', type: 'int', default: 1 })
  maxUses!: number;

  @Column({ name: 'current_uses', type: 'int', default: 0 })
  currentUses!: number;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId?: string;

  @Column({ name: 'class_name', type: 'varchar', length: 200, nullable: true })
  className?: string;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById?: string;

  @Column({ name: 'creator_name', type: 'varchar', length: 200, nullable: true })
  creatorName?: string;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed!: boolean;

  @Column({ name: 'used_at', type: 'timestamp with time zone', nullable: true })
  usedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class?: Class;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return this.currentUses < this.maxUses && !this.isExpired();
  }

  canBeUsed(): boolean {
    return this.isValid();
  }

  incrementUses(): void {
    this.currentUses++;
    if (this.currentUses >= this.maxUses) {
      this.isUsed = true;
      this.usedAt = new Date();
    }
  }
}

