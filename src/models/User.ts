import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate, TableInheritance } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../enums';
import { Submission } from './Submission';
import { ValidationError } from '../utils';
import { Class } from './Class';

/**
 * Entidade User - representa um usuário do sistema (classe base)
 */
@Entity('users')
@TableInheritance({ column: { type: 'enum', name: 'role', enum: UserRole } })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200, nullable: false })
  name!: string;

  @Column({ length: 255, nullable: false, unique: true })
  email!: string;

  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role!: UserRole;

  @Column({ name: 'last_login', type: 'timestamp with time zone', nullable: true })
  lastLogin?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relacionamentos
  @OneToMany(() => Submission, submission => submission.user)
  submissions!: Submission[];

  @OneToMany(() => Class, classEntity => classEntity.professor)
  classesTaught!: Class[];

  /**
   * Define a senha do usuário (hash bcrypt)
   */
  async setPassword(password: string): Promise<void> {
    if (!password || password.length < 12) {
      throw new Error('Senha deve ter pelo menos 12 caracteres');
    }
    
    // Validar complexidade da senha
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      throw new Error('Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial');
    }
    
    this.passwordHash = await bcrypt.hash(password, 12);
  }

  /**
   * Verifica se a senha está correta
   */
  async checkPassword(password: string): Promise<boolean> {
    if (!this.passwordHash) {
      return false;
    }
    return bcrypt.compare(password, this.passwordHash);
  }

  /**
   * Verifica se o usuário é estudante
   */
  isStudent(): boolean {
    return this.role === UserRole.STUDENT;
  }

  /**
   * Verifica se o usuário é professor
   */
  isProfessor(): boolean {
    return this.role === UserRole.PROFESSOR;
  }

  /**
   * Verifica se o usuário é assistente
   */
  isAssistant(): boolean {
    return this.role === UserRole.ASSISTANT;
  }

  /**
   * Validações antes de inserir
   */
  @BeforeInsert()
  @BeforeUpdate()
  validate(): void {
    if (!this.name || !this.name.trim()) {
      throw new ValidationError('Nome não pode estar vazio', 'NAME_REQUIRED');
    }
    
    if (!this.email || !this.email.trim()) {
      throw new ValidationError('Email não pode estar vazio', 'EMAIL_REQUIRED');
    }
    
    if (!this.email.includes('@') || !this.email.split('@')[1].includes('.')) {
      throw new ValidationError('Email deve ter um formato válido', 'INVALID_EMAIL_FORMAT');
    }

    // Normalizar email
    this.email = this.email.toLowerCase().trim();
  }

}

