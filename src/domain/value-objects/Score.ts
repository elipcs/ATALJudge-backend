import { ValidationError } from '../../utils';

/**
 * Score Value Object
 * Represents a score/grade with range validation
 */
export class Score {
  private readonly value: number;
  private static readonly MIN_VALUE = 0;
  private static readonly MAX_VALUE = 100;

  constructor(value: number) {
    if (value === null || value === undefined) {
      throw new ValidationError('Pontuação é obrigatória', 'SCORE_REQUIRED');
    }

    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError('Pontuação deve ser um número válido', 'SCORE_INVALID');
    }

    this.value = value;
    this.validate();
  }

  /**
   * Validates if the score is within the allowed range
   */
  private validate(): void {
    if (this.value < Score.MIN_VALUE) {
      throw new ValidationError(
        `Score cannot be less than ${Score.MIN_VALUE}`,
        'SCORE_TOO_LOW'
      );
    }

    if (this.value > Score.MAX_VALUE) {
      throw new ValidationError(
        `Score cannot be greater than ${Score.MAX_VALUE}`,
        'SCORE_TOO_HIGH'
      );
    }
  }

  /**
   * Returns the score value
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Retorna o valor como string
   */
  toString(): string {
    return this.value.toFixed(2);
  }

  /**
   * Adds points to the current score
   */
  add(points: number): Score {
    return new Score(this.value + points);
  }

  /**
   * Subtracts points from the current score
   */
  subtract(points: number): Score {
    return new Score(this.value - points);
  }

  /**
   * Multiplies the score by a factor
   */
  multiply(factor: number): Score {
    return new Score(this.value * factor);
  }

  /**
   * Divides the score by a divisor
   */
  divide(divisor: number): Score {
    if (divisor === 0) {
      throw new ValidationError('Cannot divide by zero', 'DIVISION_BY_ZERO');
    }
    return new Score(this.value / divisor);
  }

  /**
   * Returns the percentage of the score relative to the maximum
   */
  percentage(): number {
    return (this.value / Score.MAX_VALUE) * 100;
  }

  /**
   * Returns the percentage of the score relative to a custom maximum value
   */
  percentageOf(maxValue: number): number {
    if (maxValue <= 0) {
      throw new ValidationError('Maximum value must be greater than zero', 'INVALID_MAX_VALUE');
    }
    return (this.value / maxValue) * 100;
  }

  /**
   * Compares if two scores are equal
   */
  equals(other: Score): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Checks if this score is greater than another
   */
  isGreaterThan(other: Score): boolean {
    return this.value > other.value;
  }

  /**
   * Checks if this score is less than another
   */
  isLessThan(other: Score): boolean {
    return this.value < other.value;
  }

  /**
   * Checks if the score is zero
   */
  isZero(): boolean {
    return this.value === 0;
  }

  /**
   * Checks if the score is maximum (100)
   */
  isPerfect(): boolean {
    return this.value === Score.MAX_VALUE;
  }

  /**
   * Checks if the score is sufficient for passing (>= 60)
   */
  isPassing(): boolean {
    return this.value >= 60;
  }

  /**
   * Creates a Score from a value, returning null if invalid
   */
  static tryCreate(value: number): Score | null {
    try {
      return new Score(value);
    } catch {
      return null;
    }
  }

  /**
   * Validates if a number is a valid score
   */
  static isValid(value: number): boolean {
    try {
      new Score(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the minimum allowed score
   */
  static getMinValue(): number {
    return Score.MIN_VALUE;
  }

  /**
   * Returns the maximum allowed score
   */
  static getMaxValue(): number {
    return Score.MAX_VALUE;
  }

  /**
   * Creates a Score with value zero
   */
  static zero(): Score {
    return new Score(0);
  }

  /**
   * Creates a Score with maximum value (100)
   */
  static perfect(): Score {
    return new Score(100);
  }
}
