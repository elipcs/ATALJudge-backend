/**
 * @module utils/InputFormatAnalyzer
 * @description Utility for analyzing input format patterns from question examples
 * Detects different input styles and formats to generate generic test cases
 */

export interface InputFormatPattern {
  type: 'single-line' | 'multi-line' | 'array' | 'matrix' | 'graph' | 'string' | 'mixed';
  structure: {
    firstLine?: {
      count?: number; // Number of values in first line
      variables?: string[]; // Variable names detected (n, m, k, etc.)
    };
    dataLines?: {
      count?: number; // Number of data lines
      format?: 'space-separated' | 'line-separated' | 'matrix' | 'graph-edges';
      perLine?: number; // Values per line
    };
    hasArray?: boolean;
    hasMatrix?: boolean;
    hasGraph?: boolean;
    hasString?: boolean;
  };
  template?: string; // Template for generating similar inputs
}

/**
 * Analyzes input examples to detect format patterns
 * Supports various input styles commonly used in competitive programming
 */
export class InputFormatAnalyzer {
  /**
   * Analyzes multiple input examples to detect the common format pattern
   */
  static analyze(examples: Array<{ input: string; output?: string }>): InputFormatPattern {
    if (!examples || examples.length === 0) {
      // Default pattern: single integer
      return {
        type: 'single-line',
        structure: {
          firstLine: { count: 1, variables: ['n'] }
        }
      };
    }

    // Analyze all examples to find common patterns
    const patterns = examples.map(ex => this.analyzeSingle(ex.input));
    
    // Find the most common pattern
    const commonPattern = this.findCommonPattern(patterns);
    
    return commonPattern;
  }

  /**
   * Analyzes a single input example
   */
  private static analyzeSingle(input: string): InputFormatPattern {
    if (!input || !input.trim()) {
      return {
        type: 'single-line',
        structure: { firstLine: { count: 1, variables: ['n'] } }
      };
    }

    const lines = input.trim().split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      return {
        type: 'single-line',
        structure: { firstLine: { count: 1, variables: ['n'] } }
      };
    }

    // Analyze first line
    const firstLine = lines[0].trim();
    const firstLineValues = firstLine.split(/\s+/).filter(v => v.length > 0);
    
    // Detect if it's a graph (n m format)
    if (firstLineValues.length === 2 && this.isNumeric(firstLineValues[0]) && this.isNumeric(firstLineValues[1])) {
      const n = parseInt(firstLineValues[0]);
      const m = parseInt(firstLineValues[1]);
      
      // Check if following lines are edges (u v format)
      if (lines.length > 1 && lines.length === m + 1) {
        const isGraph = lines.slice(1).every(line => {
          const parts = line.trim().split(/\s+/);
          return parts.length >= 2 && this.isNumeric(parts[0]) && this.isNumeric(parts[1]);
        });
        
        if (isGraph) {
          return {
            type: 'graph',
            structure: {
              firstLine: { count: 2, variables: ['n', 'm'] },
              dataLines: { count: m, format: 'graph-edges', perLine: 2 },
              hasGraph: true
            },
            template: `${n} ${m}\n${lines.slice(1).join('\n')}`
          };
        }
      }
    }

    // Detect matrix (n lines, each with n or m values)
    if (lines.length > 1 && firstLineValues.length === 1) {
      const n = parseInt(firstLineValues[0]);
      if (n > 0 && lines.length === n + 1) {
        const matrixLines = lines.slice(1);
        const isMatrix = matrixLines.every(line => {
          const values = line.trim().split(/\s+/);
          return values.length > 0 && values.every(v => this.isNumeric(v));
        });
        
        if (isMatrix) {
          const colsPerRow = matrixLines[0].trim().split(/\s+/).length;
          return {
            type: 'matrix',
            structure: {
              firstLine: { count: 1, variables: ['n'] },
              dataLines: { count: n, format: 'matrix', perLine: colsPerRow },
              hasMatrix: true
            },
            template: `${n}\n${matrixLines.join('\n')}`
          };
        }
      }
    }

    // Detect array format (n on first line, array on second line)
    if (lines.length === 2 && firstLineValues.length === 1) {
      const secondLine = lines[1].trim();
      const secondLineValues = secondLine.split(/\s+/).filter(v => v.length > 0);
      
      if (this.isNumeric(firstLineValues[0]) && secondLineValues.length > 0 && 
          secondLineValues.every(v => this.isNumeric(v))) {
        return {
          type: 'array',
          structure: {
            firstLine: { count: 1, variables: ['n'] },
            dataLines: { count: 1, format: 'space-separated', perLine: secondLineValues.length },
            hasArray: true
          },
          template: `${firstLine}\n${secondLine}`
        };
      }
    }

    // Detect multiple arrays or mixed format
    if (lines.length > 2) {
      const firstLineCount = firstLineValues.length;
      const isMultiArray = lines.slice(1).every(line => {
        const values = line.trim().split(/\s+/);
        return values.length > 0 && values.every(v => this.isNumeric(v));
      });
      
      if (isMultiArray) {
        return {
          type: 'multi-line',
          structure: {
            firstLine: { count: firstLineCount, variables: this.detectVariables(firstLineValues) },
            dataLines: { count: lines.length - 1, format: 'space-separated' },
            hasArray: true
          },
          template: lines.join('\n')
        };
      }
    }

    // Detect string input
    if (lines.length === 1 && !this.isNumeric(firstLine)) {
      return {
        type: 'string',
        structure: {
          firstLine: { count: 1 },
          hasString: true
        },
        template: firstLine
      };
    }

    // Detect n strings format
    if (lines.length > 1 && firstLineValues.length === 1 && this.isNumeric(firstLineValues[0])) {
      const n = parseInt(firstLineValues[0]);
      if (n > 0 && lines.length === n + 1) {
        const isStrings = lines.slice(1).every(line => !this.isNumeric(line.trim()));
        if (isStrings) {
          return {
            type: 'string',
            structure: {
              firstLine: { count: 1, variables: ['n'] },
              dataLines: { count: n, format: 'line-separated' },
              hasString: true
            },
            template: lines.join('\n')
          };
        }
      }
    }

    // Default: single line with multiple values
    return {
      type: firstLineValues.length === 1 ? 'single-line' : 'multi-line',
      structure: {
        firstLine: { 
          count: firstLineValues.length, 
          variables: this.detectVariables(firstLineValues) 
        }
      },
      template: firstLine
    };
  }

  /**
   * Finds the most common pattern from multiple analyzed patterns
   */
  private static findCommonPattern(patterns: InputFormatPattern[]): InputFormatPattern {
    if (patterns.length === 0) {
      return {
        type: 'single-line',
        structure: { firstLine: { count: 1, variables: ['n'] } }
      };
    }

    if (patterns.length === 1) {
      return patterns[0];
    }

    // Count pattern types
    const typeCounts: Record<string, number> = {};
    patterns.forEach(p => {
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
    });

    // Find most common type
    const mostCommonType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Find pattern with most common type
    const commonPattern = patterns.find(p => p.type === mostCommonType) || patterns[0];

    // Merge structures from all patterns of the same type
    const sameTypePatterns = patterns.filter(p => p.type === mostCommonType);
    const mergedStructure = this.mergeStructures(sameTypePatterns.map(p => p.structure));

    return {
      ...commonPattern,
      structure: mergedStructure
    };
  }

  /**
   * Merges multiple structures into one
   */
  private static mergeStructures(structures: InputFormatPattern['structure'][]): InputFormatPattern['structure'] {
    const merged: InputFormatPattern['structure'] = {};

    // Merge firstLine
    const firstLines = structures.map(s => s.firstLine).filter(Boolean);
    if (firstLines.length > 0) {
      const maxCount = Math.max(...firstLines.map(fl => fl?.count || 0));
      const allVariables = new Set<string>();
      firstLines.forEach(fl => {
        fl?.variables?.forEach(v => allVariables.add(v));
      });
      
      merged.firstLine = {
        count: maxCount,
        variables: Array.from(allVariables)
      };
    }

    // Merge dataLines
    const dataLines = structures.map(s => s.dataLines).filter(Boolean);
    if (dataLines.length > 0) {
      const maxCount = Math.max(...dataLines.map(dl => dl?.count || 0));
      const maxPerLine = Math.max(...dataLines.map(dl => dl?.perLine || 0));
      const formats = dataLines.map(dl => dl?.format).filter(Boolean) as string[];
      const mostCommonFormat = formats.length > 0 
        ? formats.sort((a, b) => 
            formats.filter(f => f === a).length - formats.filter(f => f === b).length
          )[0]
        : 'space-separated';

      merged.dataLines = {
        count: maxCount,
        format: mostCommonFormat as any,
        perLine: maxPerLine
      };
    }

    // Merge flags
    merged.hasArray = structures.some(s => s.hasArray);
    merged.hasMatrix = structures.some(s => s.hasMatrix);
    merged.hasGraph = structures.some(s => s.hasGraph);
    merged.hasString = structures.some(s => s.hasString);

    return merged;
  }

  /**
   * Detects variable names from values (heuristic)
   */
  private static detectVariables(values: string[]): string[] {
    // Common variable names in competitive programming
    const commonVars = ['n', 'm', 'k', 't', 'q', 'x', 'y', 'a', 'b', 'c'];
    const detected: string[] = [];
    
    values.forEach((_, index) => {
      if (index < commonVars.length) {
        detected.push(commonVars[index]);
      } else {
        detected.push(`v${index}`);
      }
    });
    
    return detected;
  }

  /**
   * Checks if a string is numeric
   */
  private static isNumeric(str: string): boolean {
    if (!str || str.trim().length === 0) return false;
    // Check if it's a number (including negative)
    return /^-?\d+$/.test(str.trim());
  }

  /**
   * Generates input following the detected pattern
   */
  static generateInput(pattern: InputFormatPattern, values: any): string {
    if (!pattern.structure) {
      return String(values);
    }

    const { firstLine, dataLines } = pattern.structure;

    // Generate first line
    let result = '';
    if (firstLine) {
      if (firstLine.count === 1) {
        result += String(values.n || values[0] || values);
      } else {
        const firstLineValues: string[] = [];
        firstLine.variables?.forEach((varName, index) => {
          firstLineValues.push(String(values[varName] || values[index] || 0));
        });
        result += firstLineValues.join(' ');
      }
    }

    // Generate data lines
    if (dataLines && pattern.type === 'array' && values.array) {
      result += '\n' + values.array.join(' ');
    } else if (dataLines && pattern.type === 'matrix' && values.matrix) {
      values.matrix.forEach((row: number[]) => {
        result += '\n' + row.join(' ');
      });
    } else if (dataLines && pattern.type === 'graph' && values.edges) {
      values.edges.forEach((edge: [number, number]) => {
        result += '\n' + edge.join(' ');
      });
    } else if (dataLines && pattern.type === 'string' && values.strings) {
      values.strings.forEach((str: string) => {
        result += '\n' + str;
      });
    } else if (dataLines && dataLines.count && dataLines.count > 0) {
      // Generic multi-line format
      for (let i = 0; i < dataLines.count; i++) {
        if (values.dataLines && values.dataLines[i]) {
          result += '\n' + (Array.isArray(values.dataLines[i]) 
            ? values.dataLines[i].join(' ')
            : String(values.dataLines[i]));
        }
      }
    }

    return result.trim();
  }
}



