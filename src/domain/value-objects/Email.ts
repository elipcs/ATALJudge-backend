import { ValidationError } from '../../utils';

/**
 * Email Value Object
 * Garante que emails sejam sempre válidos e normalizados
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
   * Normaliza o email para lowercase e remove espaços
   */
  private normalize(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Valida o formato do email
   */
  private validate(): void {
    if (!Email.EMAIL_REGEX.test(this.value)) {
      throw new ValidationError('Email inválido', 'INVALID_EMAIL');
    }

    // Validação adicional: tamanho
    if (this.value.length > 255) {
      throw new ValidationError('Email muito longo (máximo 255 caracteres)', 'EMAIL_TOO_LONG');
    }

    // Validação adicional: parte local (antes do @)
    const [localPart, domain] = this.value.split('@');
    if (localPart.length > 64) {
      throw new ValidationError('Parte local do email muito longa (máximo 64 caracteres)', 'EMAIL_LOCAL_TOO_LONG');
    }

    // Validação adicional: domínio
    if (domain.length > 253) {
      throw new ValidationError('Domínio do email muito longo (máximo 253 caracteres)', 'EMAIL_DOMAIN_TOO_LONG');
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
   * Compara dois emails para verificar igualdade
   */
  equals(other: Email): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Retorna o domínio do email
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
   * Cria um Email a partir de uma string, retornando null se inválido
   */
  static tryCreate(email: string): Email | null {
    try {
      return new Email(email);
    } catch {
      return null;
    }
  }

  /**
   * Valida se uma string é um email válido sem criar o objeto
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
