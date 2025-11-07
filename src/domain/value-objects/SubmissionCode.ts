import { ValidationError } from '../../utils';

/**
 * SubmissionCode Value Object
 * Representa código-fonte de uma submissão com validação e sanitização
 */
export class SubmissionCode {
  private readonly value: string;
  private static readonly MAX_SIZE_BYTES = 65536; // 64 KB
  private static readonly MAX_LINES = 10000;

  constructor(code: string) {
    if (code === null || code === undefined) {
      throw new ValidationError('Código é obrigatório', 'CODE_REQUIRED');
    }

    // Permite código vazio (alguns juízes aceitam)
    this.value = code;
    this.validate();
  }

  /**
   * Valida o código
   */
  private validate(): void {
    // Validação de tamanho em bytes
    const sizeInBytes = Buffer.byteLength(this.value, 'utf8');
    if (sizeInBytes > SubmissionCode.MAX_SIZE_BYTES) {
      throw new ValidationError(
        `Código muito grande (máximo ${SubmissionCode.MAX_SIZE_BYTES} bytes)`,
        'CODE_TOO_LARGE'
      );
    }

    // Validação de número de linhas
    const lineCount = this.getLineCount();
    if (lineCount > SubmissionCode.MAX_LINES) {
      throw new ValidationError(
        `Código tem muitas linhas (máximo ${SubmissionCode.MAX_LINES} linhas)`,
        'CODE_TOO_MANY_LINES'
      );
    }
  }

  /**
   * Retorna o valor do código
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Retorna o código como string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Retorna o tamanho do código em bytes
   */
  getSizeInBytes(): number {
    return Buffer.byteLength(this.value, 'utf8');
  }

  /**
   * Retorna o tamanho do código em kilobytes
   */
  getSizeInKB(): number {
    return this.getSizeInBytes() / 1024;
  }

  /**
   * Retorna o número de linhas do código
   */
  getLineCount(): number {
    if (!this.value) return 0;
    return this.value.split('\n').length;
  }

  /**
   * Retorna o número de caracteres do código
   */
  getCharacterCount(): number {
    return this.value.length;
  }

  /**
   * Verifica se o código está vazio
   */
  isEmpty(): boolean {
    return this.value.trim().length === 0;
  }

  /**
   * Remove comentários do código (simples, para estatísticas)
   * Nota: Implementação simplificada, não cobre todos os casos
   */
  removeComments(): string {
    // Remove comentários de linha única (//)
    let cleaned = this.value.replace(/\/\/.*$/gm, '');
    
    // Remove comentários de múltiplas linhas (/* */)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return cleaned.trim();
  }

  /**
   * Retorna o número de linhas de código sem comentários
   */
  getEffectiveLineCount(): number {
    const cleaned = this.removeComments();
    if (!cleaned) return 0;
    
    // Remove linhas em branco
    const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
    return lines.length;
  }

  /**
   * Sanitiza o código removendo caracteres potencialmente perigosos
   * (para prevenir injeção de código em logs, etc)
   */
  sanitizeForDisplay(maxLength: number = 200): string {
    let sanitized = this.value
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove caracteres de controle
      .substring(0, maxLength);
    
    if (this.value.length > maxLength) {
      sanitized += '...';
    }
    
    return sanitized;
  }

  /**
   * Retorna um resumo do código (primeiras linhas)
   */
  getPreview(lines: number = 5): string {
    const codeLines = this.value.split('\n');
    const preview = codeLines.slice(0, lines).join('\n');
    
    if (codeLines.length > lines) {
      return preview + '\n...';
    }
    
    return preview;
  }

  /**
   * Verifica se o código contém uma substring
   */
  contains(substring: string): boolean {
    return this.value.includes(substring);
  }

  /**
   * Compara se dois códigos são iguais
   */
  equals(other: SubmissionCode): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Cria um SubmissionCode a partir de uma string, retornando null se inválido
   */
  static tryCreate(code: string): SubmissionCode | null {
    try {
      return new SubmissionCode(code);
    } catch {
      return null;
    }
  }

  /**
   * Valida se uma string é um código válido
   */
  static isValid(code: string): boolean {
    try {
      new SubmissionCode(code);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retorna o tamanho máximo permitido em bytes
   */
  static getMaxSizeBytes(): number {
    return SubmissionCode.MAX_SIZE_BYTES;
  }

  /**
   * Retorna o número máximo de linhas permitido
   */
  static getMaxLines(): number {
    return SubmissionCode.MAX_LINES;
  }

  /**
   * Cria um SubmissionCode vazio
   */
  static empty(): SubmissionCode {
    return new SubmissionCode('');
  }
}
