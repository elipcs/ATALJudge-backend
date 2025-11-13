/**
 * @module utils/ConstraintParser
 * @description Utility for parsing constraints from question descriptions
 * Extracts numerical limits and variable ranges from constraint strings
 */

export interface VariableConstraint {
  name: string;
  min?: number;
  max?: number;
  isArray?: boolean;
  isString?: boolean;
  stringLength?: {
    min?: number;
    max?: number;
  };
  arraySize?: {
    min?: number;
    max?: number;
  };
}

export interface ParsedConstraints {
  variables: VariableConstraint[];
  hasNegative: boolean;
  hasZero: boolean;
  hasString?: boolean;
}

/**
 * Parses constraints string and extracts variable limits
 * Supports formats like:
 * - "1 ≤ n ≤ 10^5"
 * - "0 ≤ a[i] ≤ 100"
 * - "1 <= n <= 100000"
 * - "-10^9 ≤ x ≤ 10^9"
 */
export class ConstraintParser {
  /**
   * Parses constraints text and extracts variable limits
   */
  static parse(constraints: string): ParsedConstraints {
    if (!constraints || !constraints.trim()) {
      return {
        variables: [],
        hasNegative: false,
        hasZero: false,
        hasString: false
      };
    }

    const variables: VariableConstraint[] = [];
    let hasNegative = false;
    let hasZero = false;
    let hasString = false;

    // Normalize the text
    const normalized = constraints
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/×/g, '*')
      .replace(/\^/g, '**')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // Pattern for constraints like "1 <= n <= 10^5" or "0 <= a[i] <= 100"
    const constraintPatterns = [
      // Pattern: min <= var <= max
      /(\d+(?:\*\*\d+)?)\s*<=\s*([a-z][a-z0-9_]*)(?:\[i\])?\s*<=\s*(\d+(?:\*\*\d+)?)/gi,
      // Pattern: var <= max (no min)
      /([a-z][a-z0-9_]*)(?:\[i\])?\s*<=\s*(\d+(?:\*\*\d+)?)/gi,
      // Pattern: min <= var (no max)
      /(\d+(?:\*\*\d+)?)\s*<=\s*([a-z][a-z0-9_]*)(?:\[i\])?/gi
    ];

    const foundVariables = new Set<string>();

    for (const pattern of constraintPatterns) {
      let match;
      while ((match = pattern.exec(normalized)) !== null) {
        const varName = match[2] || match[1];
        
        if (foundVariables.has(varName)) {
          continue; // Already processed
        }

        foundVariables.add(varName);

        const isArray = normalized.includes(`${varName}[i]`) || normalized.includes(`${varName}[`);
        
        let min: number | undefined;
        let max: number | undefined;

        if (match.length === 4) {
          // Pattern with both min and max: "1 <= n <= 10^5"
          min = this.parseNumber(match[1]);
          max = this.parseNumber(match[3]);
        } else if (match.length === 3 && match[0].includes('<=')) {
          // Pattern with only max: "n <= 10^5"
          const firstNum = this.parseNumber(match[1]);
          const secondNum = this.parseNumber(match[2]);
          
          if (match[0].startsWith(match[1])) {
            // Variable first, then number
            max = secondNum;
          } else {
            // Number first, then variable
            min = firstNum;
          }
        }

        if (min !== undefined && min < 0) {
          hasNegative = true;
        }
        if (min !== undefined && min === 0) {
          hasZero = true;
        }
        if (max !== undefined && max < 0) {
          hasNegative = true;
        }
        if (max !== undefined && max === 0) {
          hasZero = true;
        }

        // Check if it's a string variable
        const isString = normalized.includes(`string ${varName}`) || 
                        normalized.includes(`${varName} string`) ||
                        normalized.includes(`string[${varName}]`) ||
                        normalized.includes(`string ${varName}[`) ||
                        normalized.includes(`s[`) && varName === 's';

        // Check for array size constraints
        let arraySize: { min?: number; max?: number } | undefined;
        let stringLength: { min?: number; max?: number } | undefined;
        
        if (isArray && !isString) {
          // Look for "1 <= n <= 10^5" where n is the array size
          const arraySizePattern = new RegExp(`(\\d+(?:\\*\\*\\d+)?)\\s*<=\\s*${varName}\\s*<=\\s*(\\d+(?:\\*\\*\\d+)?)`, 'i');
          const arrayMatch = normalized.match(arraySizePattern);
          if (arrayMatch) {
            arraySize = {
              min: this.parseNumber(arrayMatch[1]),
              max: this.parseNumber(arrayMatch[2])
            };
          } else {
            // Try to find just "n <= 10^5" for array size
            const arraySizePattern2 = new RegExp(`${varName}\\s*<=\\s*(\\d+(?:\\*\\*\\d+)?)`, 'i');
            const arrayMatch2 = normalized.match(arraySizePattern2);
            if (arrayMatch2) {
              arraySize = {
                max: this.parseNumber(arrayMatch2[1])
              };
            }
          }
        }

        if (isString) {
          hasString = true;
          // Look for string length constraints like "1 <= |s| <= 100"
          const stringLengthPattern = new RegExp(`(\\d+(?:\\*\\*\\d+)?)\\s*<=\\s*\\|?${varName}\\|?\\s*<=\\s*(\\d+(?:\\*\\*\\d+)?)`, 'i');
          const stringMatch = normalized.match(stringLengthPattern);
          if (stringMatch) {
            stringLength = {
              min: this.parseNumber(stringMatch[1]),
              max: this.parseNumber(stringMatch[2])
            };
          } else {
            // Try to find just "|s| <= 100"
            const stringLengthPattern2 = new RegExp(`\\|?${varName}\\|?\\s*<=\\s*(\\d+(?:\\*\\*\\d+)?)`, 'i');
            const stringMatch2 = normalized.match(stringLengthPattern2);
            if (stringMatch2) {
              stringLength = {
                max: this.parseNumber(stringMatch2[1])
              };
            }
          }
        }

        variables.push({
          name: varName,
          min,
          max,
          isArray,
          isString,
          arraySize,
          stringLength
        });
      }
    }

    // If no variables found, try to extract common patterns
    if (variables.length === 0) {
      // Look for "n = " patterns
      const nPattern = /n\s*=\s*(\d+(?:\*\*\d+)?)/gi;
      let nMatch;
      while ((nMatch = nPattern.exec(normalized)) !== null) {
        const max = this.parseNumber(nMatch[1]);
        variables.push({
          name: 'n',
          min: 1,
          max
        });
        break;
      }
    }

    return {
      variables,
      hasNegative,
      hasZero,
      hasString
    };
  }

  /**
   * Parses a number string that may contain exponent notation
   * Examples: "10^5" -> 100000, "10**5" -> 100000, "100" -> 100
   */
  private static parseNumber(str: string): number {
    if (!str) return 0;

    // Handle exponent notation: 10^5 or 10**5
    const exponentMatch = str.match(/(\d+)(?:\*\*|\^)(\d+)/);
    if (exponentMatch) {
      const base = parseInt(exponentMatch[1], 10);
      const exponent = parseInt(exponentMatch[2], 10);
      return Math.pow(base, exponent);
    }

    // Handle negative numbers
    if (str.startsWith('-')) {
      return -parseInt(str.substring(1), 10);
    }

    return parseInt(str, 10);
  }

  /**
   * Gets the maximum value for a variable, or default if not found
   */
  static getMaxValue(constraints: ParsedConstraints, variableName: string, defaultValue: number = 100): number {
    const variable = constraints.variables.find(v => v.name === variableName);
    if (variable?.max !== undefined) {
      return variable.max;
    }
    return defaultValue;
  }

  /**
   * Gets the minimum value for a variable, or default if not found
   */
  static getMinValue(constraints: ParsedConstraints, variableName: string, defaultValue: number = 1): number {
    const variable = constraints.variables.find(v => v.name === variableName);
    if (variable?.min !== undefined) {
      return variable.min;
    }
    return defaultValue;
  }

  /**
   * Gets array size constraints
   */
  static getArraySize(constraints: ParsedConstraints, variableName: string): { min: number; max: number } {
    const variable = constraints.variables.find(v => v.name === variableName);
    if (variable?.isArray && variable?.arraySize) {
      return {
        min: variable.arraySize.min ?? 1,
        max: variable.arraySize.max ?? 100
      };
    }
    // Default array size
    return { min: 1, max: 100 };
  }

  /**
   * Gets string length constraints
   */
  static getStringLength(constraints: ParsedConstraints, variableName: string): { min: number; max: number } {
    const variable = constraints.variables.find(v => v.name === variableName);
    if (variable?.isString && variable?.stringLength) {
      return {
        min: variable.stringLength.min ?? 1,
        max: variable.stringLength.max ?? 100
      };
    }
    // Default string length
    return { min: 1, max: 100 };
  }

  /**
   * Checks if constraints contain string variables
   */
  static hasStringVariables(constraints: ParsedConstraints): boolean {
    return constraints.hasString || constraints.variables.some(v => v.isString);
  }
}

