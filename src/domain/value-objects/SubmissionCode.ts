import { ValidationError } from '../../utils';

/**
 * SubmissionCode Value Object
 * Represents source code of a submission with validation and sanitization
 */
export class SubmissionCode {
  private readonly value: string;
  private static readonly MAX_SIZE_BYTES = 65536; // 64 KB
  private static readonly MAX_LINES = 10000;

  constructor(code: string) {
    if (code === null || code === undefined) {
      throw new ValidationError('Code is required', 'CODE_REQUIRED');
    }

    // Allows empty code (some judges accept it)
    this.value = code;
    this.validate();
  }

  /**
   * Validates the code
   */
  private validate(): void {
    // Size validation in bytes
    const sizeInBytes = Buffer.byteLength(this.value, 'utf8');
    if (sizeInBytes > SubmissionCode.MAX_SIZE_BYTES) {
      throw new ValidationError(
        `Code too large (maximum ${SubmissionCode.MAX_SIZE_BYTES} bytes)`,
        'CODE_TOO_LARGE'
      );
    }

    // Line count validation
    const lineCount = this.getLineCount();
    if (lineCount > SubmissionCode.MAX_LINES) {
      throw new ValidationError(
        `Code has too many lines (maximum ${SubmissionCode.MAX_LINES} lines)`,
        'CODE_TOO_MANY_LINES'
      );
    }
  }

  /**
   * Returns the code value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Returns the code as string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Returns the code size in bytes
   */
  getSizeInBytes(): number {
    return Buffer.byteLength(this.value, 'utf8');
  }

  /**
   * Returns the code size in kilobytes
   */
  getSizeInKB(): number {
    return this.getSizeInBytes() / 1024;
  }

  /**
   * Returns the number of code lines
   */
  getLineCount(): number {
    if (!this.value) return 0;
    return this.value.split('\n').length;
  }

  /**
   * Returns the character count of the code
   */
  getCharacterCount(): number {
    return this.value.length;
  }

  /**
   * Checks if the code is empty
   */
  isEmpty(): boolean {
    return this.value.trim().length === 0;
  }

  /**
   * Removes code comments (simple, for statistics)
   * Note: Simplified implementation, does not cover all cases
   */
  removeComments(): string {
    // Remove single-line comments (//)
    let cleaned = this.value.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments (/* */)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return cleaned.trim();
  }

  /**
   * Returns the number of code lines without comments
   */
  getEffectiveLineCount(): number {
    const cleaned = this.removeComments();
    if (!cleaned) return 0;
    
    // Remove blank lines
    const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
    return lines.length;
  }

  /**
   * Sanitizes the code by removing potentially dangerous characters
   * (to prevent code injection in logs, etc)
   */
  sanitizeForDisplay(maxLength: number = 200): string {
    let sanitized = this.value
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .substring(0, maxLength);
    
    if (this.value.length > maxLength) {
      sanitized += '...';
    }
    
    return sanitized;
  }

  /**
   * Returns a preview of the code (first lines)
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
   * Checks if the code contains a substring
   */
  contains(substring: string): boolean {
    return this.value.includes(substring);
  }

  /**
   * Compares if two codes are equal
   */
  equals(other: SubmissionCode): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Creates a SubmissionCode from a string, returning null if invalid
   */
  static tryCreate(code: string): SubmissionCode | null {
    try {
      return new SubmissionCode(code);
    } catch {
      return null;
    }
  }

  /**
   * Validates if a string is valid code
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
   * Returns the maximum allowed size in bytes
   */
  static getMaxSizeBytes(): number {
    return SubmissionCode.MAX_SIZE_BYTES;
  }

  /**
   * Returns the maximum allowed number of lines
   */
  static getMaxLines(): number {
    return SubmissionCode.MAX_LINES;
  }

  /**
   * Creates an empty SubmissionCode
   */
  static empty(): SubmissionCode {
    return new SubmissionCode('');
  }
}
