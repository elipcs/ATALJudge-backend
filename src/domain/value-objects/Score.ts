import { ValidationError } from '../../utils';

/**
 * Score Value Object
 * Representa uma pontuação/nota com validação de range
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
   * Valida se a pontuação está dentro do range permitido
   */
  private validate(): void {
    if (this.value < Score.MIN_VALUE) {
      throw new ValidationError(
        `Pontuação não pode ser menor que ${Score.MIN_VALUE}`,
        'SCORE_TOO_LOW'
      );
    }

    if (this.value > Score.MAX_VALUE) {
      throw new ValidationError(
        `Pontuação não pode ser maior que ${Score.MAX_VALUE}`,
        'SCORE_TOO_HIGH'
      );
    }
  }

  /**
   * Retorna o valor da pontuação
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
   * Adiciona pontos à pontuação atual
   */
  add(points: number): Score {
    return new Score(this.value + points);
  }

  /**
   * Subtrai pontos da pontuação atual
   */
  subtract(points: number): Score {
    return new Score(this.value - points);
  }

  /**
   * Multiplica a pontuação por um fator
   */
  multiply(factor: number): Score {
    return new Score(this.value * factor);
  }

  /**
   * Divide a pontuação por um divisor
   */
  divide(divisor: number): Score {
    if (divisor === 0) {
      throw new ValidationError('Não é possível dividir por zero', 'DIVISION_BY_ZERO');
    }
    return new Score(this.value / divisor);
  }

  /**
   * Retorna a porcentagem da pontuação em relação ao máximo
   */
  percentage(): number {
    return (this.value / Score.MAX_VALUE) * 100;
  }

  /**
   * Retorna a porcentagem da pontuação em relação a um valor máximo customizado
   */
  percentageOf(maxValue: number): number {
    if (maxValue <= 0) {
      throw new ValidationError('Valor máximo deve ser maior que zero', 'INVALID_MAX_VALUE');
    }
    return (this.value / maxValue) * 100;
  }

  /**
   * Compara se duas pontuações são iguais
   */
  equals(other: Score): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Verifica se esta pontuação é maior que outra
   */
  isGreaterThan(other: Score): boolean {
    return this.value > other.value;
  }

  /**
   * Verifica se esta pontuação é menor que outra
   */
  isLessThan(other: Score): boolean {
    return this.value < other.value;
  }

  /**
   * Verifica se a pontuação é zero
   */
  isZero(): boolean {
    return this.value === 0;
  }

  /**
   * Verifica se a pontuação é máxima (100)
   */
  isPerfect(): boolean {
    return this.value === Score.MAX_VALUE;
  }

  /**
   * Verifica se a pontuação é suficiente para aprovação (>= 60)
   */
  isPassing(): boolean {
    return this.value >= 60;
  }

  /**
   * Cria um Score a partir de um valor, retornando null se inválido
   */
  static tryCreate(value: number): Score | null {
    try {
      return new Score(value);
    } catch {
      return null;
    }
  }

  /**
   * Valida se um número é uma pontuação válida
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
   * Retorna a pontuação mínima permitida
   */
  static getMinValue(): number {
    return Score.MIN_VALUE;
  }

  /**
   * Retorna a pontuação máxima permitida
   */
  static getMaxValue(): number {
    return Score.MAX_VALUE;
  }

  /**
   * Cria um Score com valor zero
   */
  static zero(): Score {
    return new Score(0);
  }

  /**
   * Cria um Score com valor máximo (100)
   */
  static perfect(): Score {
    return new Score(100);
  }
}
