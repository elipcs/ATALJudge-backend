import { ValidationError } from '../../utils';

/**
 * StudentRegistration Value Object
 * Representa uma matrícula de aluno com validação de formato
 */
export class StudentRegistration {
  private readonly value: string;
  private static readonly REGISTRATION_REGEX = /^[0-9]{9,11}$/;
  private static readonly MIN_LENGTH = 6;
  private static readonly MAX_LENGTH = 20;

  constructor(registration: string) {
    if (!registration) {
      throw new ValidationError('Matrícula é obrigatória', 'REGISTRATION_REQUIRED');
    }

    this.value = this.normalize(registration);
    this.validate();
  }

  /**
   * Normaliza a matrícula para uppercase e remove espaços
   */
  private normalize(registration: string): string {
    return registration.toUpperCase().trim();
  }

  /**
   * Valida o formato da matrícula
   */
  private validate(): void {
    // Validação de tamanho
    if (this.value.length < StudentRegistration.MIN_LENGTH) {
      throw new ValidationError(
        `Matrícula deve ter no mínimo ${StudentRegistration.MIN_LENGTH} digitos`,
        'REGISTRATION_TOO_SHORT'
      );
    }

    if (this.value.length > StudentRegistration.MAX_LENGTH) {
      throw new ValidationError(
        `Matrícula deve ter no máximo ${StudentRegistration.MAX_LENGTH} digitos`,
        'REGISTRATION_TOO_LONG'
      );
    }

    // Validação de formato (números apenas)
    if (!StudentRegistration.REGISTRATION_REGEX.test(this.value)) {
      throw new ValidationError(
        'Matrícula deve conter apenas números',
        'INVALID_REGISTRATION_FORMAT'
      );
    }
  }

  /**
   * Retorna o valor da matrícula
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Retorna o valor como string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Compara se duas matrículas são iguais
   */
  equals(other: StudentRegistration): boolean {
    if (!other) return false;
    return this.value === other.value;
  }


  /**
   * Cria um StudentRegistration a partir de uma string, retornando null se inválido
   */
  static tryCreate(registration: string): StudentRegistration | null {
    try {
      return new StudentRegistration(registration);
    } catch {
      return null;
    }
  }

  /**
   * Valida se uma string é uma matrícula válida
   */
  static isValid(registration: string): boolean {
    try {
      new StudentRegistration(registration);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retorna os requisitos de formato da matrícula
   */
  static getRequirements(): {
    minLength: number;
    maxLength: number;
    allowedCharacters: string;
    format: string;
  } { 
    return {
      minLength: StudentRegistration.MIN_LENGTH,
      maxLength: StudentRegistration.MAX_LENGTH,
      allowedCharacters: '0-9',
      format: 'Números apenas',
    };
  }
}
