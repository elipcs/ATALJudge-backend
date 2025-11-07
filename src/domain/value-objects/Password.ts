import bcrypt from 'bcryptjs';
import { ValidationError } from '../../utils';

/**
 * Password Value Object
 * Gerencia senhas de forma segura com validação e hashing
 */
export class Password {
  private readonly hashedValue: string;
  private static readonly MIN_LENGTH = 12;
  private static readonly MAX_LENGTH = 128;
  private static readonly SALT_ROUNDS = 10;

  /**
   * Construtor privado - use os métodos estáticos para criar instâncias
   */
  private constructor(hashedValue: string) {
    this.hashedValue = hashedValue;
  }

  /**
   * Cria um Password a partir de uma senha em texto puro
   * Valida a força da senha e a armazena hasheada
   */
  static async create(plainPassword: string): Promise<Password> {
    if (!plainPassword) {
      throw new ValidationError('Senha é obrigatória', 'PASSWORD_REQUIRED');
    }

    // Valida a força da senha
    Password.validateStrength(plainPassword);

    // Hasheia a senha
    const hashed = await bcrypt.hash(plainPassword, Password.SALT_ROUNDS);
    return new Password(hashed);
  }

  /**
   * Cria um Password a partir de um hash já existente
   * Usado ao carregar do banco de dados
   */
  static fromHash(hashedPassword: string): Password {
    if (!hashedPassword) {
      throw new ValidationError('Hash de senha é obrigatório', 'PASSWORD_HASH_REQUIRED');
    }
    return new Password(hashedPassword);
  }

  /**
   * Valida a força da senha
   */
  private static validateStrength(password: string): void {
    // Tamanho mínimo
    if (password.length < Password.MIN_LENGTH) {
      throw new ValidationError(
        `Senha deve ter no mínimo ${Password.MIN_LENGTH} caracteres`,
        'PASSWORD_TOO_SHORT'
      );
    }

    // Tamanho máximo
    if (password.length > Password.MAX_LENGTH) {
      throw new ValidationError(
        `Senha deve ter no máximo ${Password.MAX_LENGTH} caracteres`,
        'PASSWORD_TOO_LONG'
      );
    }

    // Ao menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      throw new ValidationError(
        'Senha deve conter ao menos uma letra maiúscula',
        'PASSWORD_NO_UPPERCASE'
      );
    }

    // Ao menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      throw new ValidationError(
        'Senha deve conter ao menos uma letra minúscula',
        'PASSWORD_NO_LOWERCASE'
      );
    }

    // Ao menos um número
    if (!/\d/.test(password)) {
      throw new ValidationError(
        'Senha deve conter ao menos um número',
        'PASSWORD_NO_NUMBER'
      );
    }

    // Ao menos um caractere especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError(
        'Senha deve conter ao menos um caractere especial',
        'PASSWORD_NO_SPECIAL'
      );
    }
  }

  /**
   * Compara uma senha em texto puro com o hash armazenado
   */
  async compare(plainPassword: string): Promise<boolean> {
    if (!plainPassword) return false;
    return bcrypt.compare(plainPassword, this.hashedValue);
  }

  /**
   * Retorna o hash da senha
   */
  getHash(): string {
    return this.hashedValue;
  }

  /**
   * Verifica se uma senha em texto puro é forte o suficiente
   * Útil para validação no frontend antes de enviar
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
