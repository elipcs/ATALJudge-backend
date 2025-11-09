import bcrypt from 'bcryptjs';
import { ValidationError } from '../../utils';

/**
 * Password Value Object
 * Manages passwords securely with validation and hashing
 */
export class Password {
  private readonly hashedValue: string;
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly SALT_ROUNDS = 10;

  /**
   * Private constructor - use static methods to create instances
   */
  private constructor(hashedValue: string) {
    this.hashedValue = hashedValue;
  }

  /**
   * Creates a Password from a plain text password
   * Validates password strength and stores it hashed
   */
  static async create(plainPassword: string): Promise<Password> {
    if (!plainPassword) {
      throw new ValidationError('Senha é obrigatória', 'PASSWORD_REQUIRED');
    }

    // Validates password strength
    Password.validateStrength(plainPassword);

    // Hashes the password
    const hashed = await bcrypt.hash(plainPassword, Password.SALT_ROUNDS);
    return new Password(hashed);
  }

  /**
   * Creates a Password from an already existing hash
   * Used when loading from database
   */
  static fromHash(hashedPassword: string): Password {
    if (!hashedPassword) {
      throw new ValidationError('Hash de senha é obrigatório', 'PASSWORD_HASH_REQUIRED');
    }
    return new Password(hashedPassword);
  }

  /**
   * Validates password strength
   */
  private static validateStrength(password: string): void {
    // Minimum size
    if (password.length < Password.MIN_LENGTH) {
      throw new ValidationError(
        `Password must have at least ${Password.MIN_LENGTH} characters`,
        'PASSWORD_TOO_SHORT'
      );
    }

    // Maximum size
    if (password.length > Password.MAX_LENGTH) {
      throw new ValidationError(
        `Password must have at most ${Password.MAX_LENGTH} characters`,
        'PASSWORD_TOO_LONG'
      );
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter',
        'PASSWORD_NO_UPPERCASE'
      );
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new ValidationError(
        'Password must contain at least one lowercase letter',
        'PASSWORD_NO_LOWERCASE'
      );
    }

    // At least one number
    if (!/\d/.test(password)) {
      throw new ValidationError(
        'Password must contain at least one number',
        'PASSWORD_NO_NUMBER'
      );
    }

    // At least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError(
        'Password must contain at least one special character',
        'PASSWORD_NO_SPECIAL'
      );
    }
  }

  /**
   * Compares a plain text password with the stored hash
   */
  async compare(plainPassword: string): Promise<boolean> {
    if (!plainPassword) return false;
    return bcrypt.compare(plainPassword, this.hashedValue);
  }

  /**
   * Returns the password hash
   */
  getHash(): string {
    return this.hashedValue;
  }

  /**
   * Checks if a plain text password is strong enough
   * Useful for validation on frontend before sending
   */
  static isStrongEnough(password: string): boolean {
    try {
      Password.validateStrength(password);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retorna os requisitos de senha como objeto
   */
  static getRequirements(): {
    minLength: number;
    maxLength: number;
    requiresUppercase: boolean;
    requiresLowercase: boolean;
    requiresNumber: boolean;
    requiresSpecial: boolean;
  } {
    return {
      minLength: Password.MIN_LENGTH,
      maxLength: Password.MAX_LENGTH,
      requiresUppercase: true,
      requiresLowercase: true,
      requiresNumber: true,
      requiresSpecial: true,
    };
  }

  /**
   * Valida e retorna lista de erros de uma senha
   */
  static validateAndGetErrors(password: string): string[] {
    const errors: string[] = [];

    if (!password) {
      errors.push('Senha é obrigatória');
      return errors;
    }

    if (password.length < Password.MIN_LENGTH) {
      errors.push(`Senha deve ter no mínimo ${Password.MIN_LENGTH} caracteres`);
    }

    if (password.length > Password.MAX_LENGTH) {
      errors.push(`Senha deve ter no máximo ${Password.MAX_LENGTH} caracteres`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter ao menos uma letra maiúscula');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter ao menos uma letra minúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('Senha deve conter ao menos um número');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter ao menos um caractere especial');
    }

    return errors;
  }
}
