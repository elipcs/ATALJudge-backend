import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate, TableInheritance, ManyToOne, JoinColumn } from 'typeorm';
import { UserRole } from '../enums';
import { Submission } from './Submission';
import { ValidationError } from '../utils';
import { Class } from './Class';
import { Email, Password } from '../domain/value-objects';

@Entity('users')
@TableInheritance({ column: { type: 'enum', name: 'role', enum: UserRole } })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200, nullable: false })
  name!: string;

  @Column({ length: 255, nullable: false, unique: true })
  private _email!: string;

  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash?: string;

  // Getter e setter para Email Value Object
  get email(): string {
    return this._email;
  }

  set email(value: string) {
    const emailVO = Email.tryCreate(value);
    if (emailVO) {
      this._email = emailVO.getValue();
    } else {
      this._email = value; // Permite temporariamente para validação posterior
    }
  }

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

  @OneToMany(() => Submission, submission => submission.user)
  submissions!: Submission[];

  @OneToMany(() => Class, classEntity => classEntity.professor)
  classesTaught!: Class[];

  @ManyToOne(() => Class, classEntity => classEntity.students, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class?: Class;

  /**
   * Define a senha do usuário usando Password Value Object
   */
  async setPassword(password: string): Promise<void> {
    const passwordVO = await Password.create(password);
    this.passwordHash = passwordVO.getHash();
  }

  /**
   * Verifica se a senha está correta usando Password Value Object
   */
  async checkPassword(password: string): Promise<boolean> {
    if (!this.passwordHash) {
      return false;
    }
    const passwordVO = Password.fromHash(this.passwordHash);
    return passwordVO.compare(password);
  }

  isStudent(): boolean {
    return this.role === UserRole.STUDENT;
  }

  isProfessor(): boolean {
    return this.role === UserRole.PROFESSOR;
  }

  isAssistant(): boolean {
    return this.role === UserRole.ASSISTANT;
  }

  // ============================================================
  // ADDITIONAL DOMAIN METHODS (Business Logic)
  // ============================================================

  /**
   * Verifica se o usuário possui uma role específica
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Verifica se o usuário pode gerenciar turmas
   * (Professores e Assistentes podem)
   */
  canManageClasses(): boolean {
    return this.isProfessor() || this.isAssistant();
  }

  /**
   * Verifica se o usuário pode criar questões
   * (Professores e Assistentes podem)
   */
  canCreateQuestions(): boolean {
    return this.isProfessor() || this.isAssistant();
  }

  /**
   * Verifica se o usuário pode submeter código
   * (Apenas estudantes podem submeter)
   */
  canSubmitCode(): boolean {
    return this.isStudent();
  }

  /**
   * Verifica se o usuário pode avaliar submissões
   * (Professores e Assistentes podem)
   */
  canGradeSubmissions(): boolean {
    return this.isProfessor() || this.isAssistant();
  }

  /**
   * Verifica se o usuário está ativo (possui último login nos últimos 90 dias)
   */
  isActive(): boolean {
    if (!this.lastLogin) return false;
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    return this.lastLogin >= ninetyDaysAgo;
  }

  /**
   * Verifica se o usuário é um novo usuário (criado há menos de 7 dias)
   */
  isNewUser(): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return this.createdAt >= sevenDaysAgo;
  }

  /**
   * Atualiza o último login do usuário
   */
  updateLastLogin(): void {
    this.lastLogin = new Date();
  }

  /**
   * Obtém o nome formatado (primeira letra maiúscula)
   */
  getFormattedName(): string {
    return this.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Verifica se o usuário tem senha configurada
   */
  hasPassword(): boolean {
    return !!this.passwordHash;
  }

  @BeforeInsert()
  @BeforeUpdate()
  validate(): void {
    if (!this.name || !this.name.trim()) {
      throw new ValidationError('Name cannot be empty', 'NAME_REQUIRED');
    }
    
    if (!this._email || !this._email.trim()) {
      throw new ValidationError('Email cannot be empty', 'EMAIL_REQUIRED');
    }
    
    // Validates and normalizes using Email Value Object
    const emailVO = Email.tryCreate(this._email);
    if (!emailVO) {
      throw new ValidationError('Email must have a valid format', 'INVALID_EMAIL_FORMAT');
    }
    this._email = emailVO.getValue();
  }

}

