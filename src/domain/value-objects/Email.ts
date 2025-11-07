import { ValidationError } from '../../utils';

/**
 * Email Value Object
 * Ensures that emails are always valid and normalized
 */
export class Email {
  private readonly value: string;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(email: string) {
    if (!email) {
      throw new ValidationError('Email é obrigatório', 'EMAIL_REQUIRED');
    }

    this.value = this.normalize(email);
    this.validate();
  }

  /**
   * Normalizes email to lowercase and removes spaces
   */
  private normalize(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Validates email format
   */
  private validate(): void {
    if (!Email.EMAIL_REGEX.test(this.value)) {
      throw new ValidationError('Invalid email', 'INVALID_EMAIL');
    }

    // Additional validation: size
    if (this.value.length > 255) {
      throw new ValidationError('Email too long (maximum 255 characters)', 'EMAIL_TOO_LONG');
    }

    // Additional validation: local part (before @)
    const [localPart, domain] = this.value.split('@');
    if (localPart.length > 64) {
      throw new ValidationError('Email local part too long (maximum 64 characters)', 'EMAIL_LOCAL_TOO_LONG');
    }

    // Additional validation: domain
    if (domain.length > 253) {
      throw new ValidationError('Email domain too long (maximum 253 characters)', 'EMAIL_DOMAIN_TOO_LONG');
    }
  }

  /**
   * Retorna o valor do email como string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Retorna o valor do email (alias para toString)
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compares two emails to check equality
   */
  equals(other: Email): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Returns the email domain
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Retorna a parte local do email (antes do @)
   */
  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * Creates an Email from a string, returning null if invalid
   */
  static tryCreate(email: string): Email | null {
    try {
      return new Email(email);
    } catch {
      return null;
    }
  }

  /**
   * Validates if a string is a valid email without creating the object
   */
  static isValid(email: string): boolean {
    try {
      new Email(email);
      return true;
    } catch {
      return false;
    }
  }
}
