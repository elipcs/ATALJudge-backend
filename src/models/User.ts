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
  email!: string;

  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash?: string;

  /**
   * Sets the email using Email Value Object
   */
  setEmail(value: string): void {
    const emailVO = Email.tryCreate(value);
    if (emailVO) {
      this.email = emailVO.getValue();
    } else {
      this.email = value;
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
   * Sets the user password using Password Value Object
   */
  async setPassword(password: string): Promise<void> {
    const passwordVO = await Password.create(password);
    this.passwordHash = passwordVO.getHash();
  }

  /**
   * Checks if the password is correct using Password Value Object
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
   * Checks if the user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Checks if the user can manage classes
   * (Professors and Assistants can)
   */
  canManageClasses(): boolean {
    return this.isProfessor() || this.isAssistant();
  }

  /**
   * Checks if the user can create questions
   * (Professors and Assistants can)
   */
  canCreateQuestions(): boolean {
    return this.isProfessor() || this.isAssistant();
  }

  /**
   * Checks if the user can submit code
   * (Only students can submit)
   */
  canSubmitCode(): boolean {
    return this.isStudent();
  }

  /**
   * Checks if the user can grade submissions
   * (Professors and Assistants can)
   */
  canGradeSubmissions(): boolean {
    return this.isProfessor() || this.isAssistant();
  }

  /**
   * Checks if the user is active (has logged in within the last 90 days)
   */
  isActive(): boolean {
    if (!this.lastLogin) return false;
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    return this.lastLogin >= ninetyDaysAgo;
  }

  /**
   * Checks if the user is a new user (created less than 7 days ago)
   */
  isNewUser(): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return this.createdAt >= sevenDaysAgo;
  }

  /**
   * Updates the user's last login timestamp
   */
  updateLastLogin(): void {
    this.lastLogin = new Date();
  }

  /**
   * Gets the formatted name (first letter uppercase)
   */
  getFormattedName(): string {
    return this.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Checks if the user has a password configured
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
    
    if (!this.email || !this.email.trim()) {
      throw new ValidationError('Email cannot be empty', 'EMAIL_REQUIRED');
    }
    
    // Validates and normalizes using Email Value Object
    const emailVO = Email.tryCreate(this.email);
    if (!emailVO) {
      throw new ValidationError('Email must have a valid format', 'INVALID_EMAIL_FORMAT');
    }
    this.email = emailVO.getValue();
  }

}

