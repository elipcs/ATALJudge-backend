import { ValidationError } from '../../utils';

/**
 * StudentRegistration Value Object
 * Represents a student registration with format validation
 */
export class StudentRegistration {
  private readonly value: string;
  private static readonly REGISTRATION_REGEX = /^[0-9]{9}$|^[0-9]{11}$/;
  private static readonly MIN_LENGTH = 9;
  private static readonly MAX_LENGTH = 11;

  constructor(registration: string) {
    if (!registration) {
      throw new ValidationError('Matrícula é obrigatória', 'REGISTRATION_REQUIRED');
    }

    this.value = this.normalize(registration);
    this.validate();
  }

  /**
   * Normalizes registration to uppercase and removes spaces
   */
  private normalize(registration: string): string {
    return registration.toUpperCase().trim();
  }

  /**
   * Validates registration format
   */
  private validate(): void {
    // Size validation
    if (this.value.length < StudentRegistration.MIN_LENGTH) {
      throw new ValidationError(
        `Registration must have at least ${StudentRegistration.MIN_LENGTH} digits`,
        'REGISTRATION_TOO_SHORT'
      );
    }

    if (this.value.length > StudentRegistration.MAX_LENGTH) {
      throw new ValidationError(
        `Registration must have at most ${StudentRegistration.MAX_LENGTH} digits`,
        'REGISTRATION_TOO_LONG'
      );
    }

    // Format validation (numbers only)
    if (!StudentRegistration.REGISTRATION_REGEX.test(this.value)) {
      throw new ValidationError(
        'Registration must contain only numbers',
        'INVALID_REGISTRATION_FORMAT'
      );
    }
  }

  /**
   * Returns the registration value
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
   * Compares if two registrations are equal
   */
  equals(other: StudentRegistration): boolean {
    if (!other) return false;
    return this.value === other.value;
  }


  /**
   * Creates a StudentRegistration from a string, returning null if invalid
   */
  static tryCreate(registration: string): StudentRegistration | null {
    try {
      return new StudentRegistration(registration);
    } catch {
      return null;
    }
  }

  /**
   * Validates if a string is a valid registration
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
   * Returns the registration format requirements
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
      format: 'Numbers only',
    };
  }
}
