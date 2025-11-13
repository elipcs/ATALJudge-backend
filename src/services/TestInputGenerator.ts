/**
 * @module services/TestInputGenerator
 * @description Service for generating test inputs based on algorithm type and constraints
 * Provides different strategies for different algorithm categories
 */

import { ParsedConstraints, ConstraintParser } from '../utils/ConstraintParser';
import { AlgorithmType } from '../dtos/TestCaseGeneratorDtos';

export interface GenerationConfig {
  count: number;
  algorithmType: AlgorithmType;
  constraints: ParsedConstraints;
  questionStatement?: string;
}

export class TestInputGenerator {
  /**
   * Generates test inputs based on algorithm type and constraints
   */
  static generate(config: GenerationConfig): string[] {
    const { count, algorithmType, constraints } = config;

    switch (algorithmType) {
      case 'backtracking':
        return this.generateBacktrackingInputs(count, constraints);
      case 'graph':
        return this.generateGraphInputs(count, constraints);
      case 'divide-conquer':
        return this.generateDivideConquerInputs(count, constraints);
      case 'brute-force':
        return this.generateBruteForceInputs(count, constraints);
      case 'greedy':
        return this.generateGreedyInputs(count, constraints);
      case 'dynamic-programming':
        return this.generateDynamicProgrammingInputs(count, constraints);
      case 'math':
        return this.generateMathInputs(count, constraints);
      case 'string':
        return this.generateStringInputs(count, constraints);
      default:
        return this.generateDefaultInputs(count, constraints);
    }
  }

  /**
   * Generates inputs for backtracking problems
   * Strategy: 30% edge cases, 70% small random cases (n ≤ 20)
   */
  private static generateBacktrackingInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const nMax = Math.min(ConstraintParser.getMaxValue(constraints, 'n', 20), 20);
    const nMin = ConstraintParser.getMinValue(constraints, 'n', 1);

    const edgeCount = Math.floor(count * 0.3);
    const randomCount = count - edgeCount;

    // Edge cases
    for (let i = 0; i < edgeCount; i++) {
      if (i === 0 && nMin <= 1) {
        inputs.push(this.generateInputForN(constraints, 1));
      } else if (i === 1 && nMax >= 1) {
        inputs.push(this.generateInputForN(constraints, nMax));
      } else {
        inputs.push(this.generateInputForN(constraints, nMin));
      }
    }

    // Random small cases
    for (let i = 0; i < randomCount; i++) {
      const n = this.randomInt(nMin, Math.min(nMax, 20));
      inputs.push(this.generateInputForN(constraints, n));
    }

    return inputs;
  }

  /**
   * Generates inputs for graph problems
   * Strategy: 20% single node, 20% complete graph, 20% tree, 40% random
   */
  private static generateGraphInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const nMax = ConstraintParser.getMaxValue(constraints, 'n', 100);
    const nMin = ConstraintParser.getMinValue(constraints, 'n', 1);
    const mMax = ConstraintParser.getMaxValue(constraints, 'm', nMax * (nMax - 1) / 2);

    const singleNodeCount = Math.floor(count * 0.2);
    const completeCount = Math.floor(count * 0.2);
    const treeCount = Math.floor(count * 0.2);
    const randomCount = count - singleNodeCount - completeCount - treeCount;

    // Single node
    for (let i = 0; i < singleNodeCount; i++) {
      inputs.push(this.generateGraphInput(1, 0, constraints));
    }

    // Complete graph
    for (let i = 0; i < completeCount; i++) {
      const n = this.randomInt(Math.min(nMin, 2), Math.min(nMax, 10));
      const m = n * (n - 1) / 2;
      inputs.push(this.generateGraphInput(n, m, constraints));
    }

    // Tree (n-1 edges)
    for (let i = 0; i < treeCount; i++) {
      const n = this.randomInt(nMin, Math.min(nMax, 50));
      inputs.push(this.generateGraphInput(n, n - 1, constraints));
    }

    // Random graphs
    for (let i = 0; i < randomCount; i++) {
      const n = this.randomInt(nMin, Math.min(nMax, 50));
      const maxEdges = Math.min(mMax, n * (n - 1) / 2);
      const m = this.randomInt(n - 1, maxEdges);
      inputs.push(this.generateGraphInput(n, m, constraints));
    }

    return inputs;
  }

  /**
   * Generates inputs for divide and conquer problems
   * Strategy: 25% sorted ascending, 25% sorted descending, 25% random, 25% with duplicates
   */
  private static generateDivideConquerInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const nMax = ConstraintParser.getMaxValue(constraints, 'n', 1000);
    const nMin = ConstraintParser.getMinValue(constraints, 'n', 1);
    const valueMax = ConstraintParser.getMaxValue(constraints, 'a', 10**9);
    const valueMin = ConstraintParser.getMinValue(constraints, 'a', -(10**9));

    const sortedAscCount = Math.floor(count * 0.25);
    const sortedDescCount = Math.floor(count * 0.25);
    const randomCount = Math.floor(count * 0.25);
    const duplicatesCount = count - sortedAscCount - sortedDescCount - randomCount;

    // Sorted ascending
    for (let i = 0; i < sortedAscCount; i++) {
      const n = this.randomInt(nMin, nMax);
      const arr = this.generateSortedArray(n, valueMin, valueMax, true);
      inputs.push(this.formatArrayInput(n, arr, constraints));
    }

    // Sorted descending
    for (let i = 0; i < sortedDescCount; i++) {
      const n = this.randomInt(nMin, nMax);
      const arr = this.generateSortedArray(n, valueMin, valueMax, false);
      inputs.push(this.formatArrayInput(n, arr, constraints));
    }

    // Random
    for (let i = 0; i < randomCount; i++) {
      const n = this.randomInt(nMin, nMax);
      const arr = this.generateRandomArray(n, valueMin, valueMax);
      inputs.push(this.formatArrayInput(n, arr, constraints));
    }

    // With duplicates
    for (let i = 0; i < duplicatesCount; i++) {
      const n = this.randomInt(nMin, nMax);
      const arr = this.generateArrayWithDuplicates(n, valueMin, valueMax);
      inputs.push(this.formatArrayInput(n, arr, constraints));
    }

    return inputs;
  }

  /**
   * Generates inputs for brute force problems
   * Strategy: 40% edge cases, 60% small random cases (n ≤ 15)
   */
  private static generateBruteForceInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const nMax = Math.min(ConstraintParser.getMaxValue(constraints, 'n', 15), 15);
    const nMin = ConstraintParser.getMinValue(constraints, 'n', 1);

    const edgeCount = Math.floor(count * 0.4);
    const randomCount = count - edgeCount;

    // Edge cases
    for (let i = 0; i < edgeCount; i++) {
      if (i === 0 && nMin <= 1) {
        inputs.push(this.generateInputForN(constraints, 1));
      } else if (i === 1 && nMax >= 1) {
        inputs.push(this.generateInputForN(constraints, nMax));
      } else {
        inputs.push(this.generateInputForN(constraints, nMin));
      }
    }

    // Random small cases
    for (let i = 0; i < randomCount; i++) {
      const n = this.randomInt(nMin, nMax);
      inputs.push(this.generateInputForN(constraints, n));
    }

    return inputs;
  }

  /**
   * Generates inputs for greedy problems
   * Strategy: 30% edge cases that break naive strategies, 70% random
   */
  private static generateGreedyInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const nMax = ConstraintParser.getMaxValue(constraints, 'n', 100);
    const nMin = ConstraintParser.getMinValue(constraints, 'n', 1);

    const edgeCount = Math.floor(count * 0.3);
    const randomCount = count - edgeCount;

    // Edge cases
    for (let i = 0; i < edgeCount; i++) {
      if (i === 0 && nMin <= 1) {
        inputs.push(this.generateInputForN(constraints, 1));
      } else if (i === 1 && nMax >= 1) {
        inputs.push(this.generateInputForN(constraints, nMax));
      } else {
        inputs.push(this.generateInputForN(constraints, nMin));
      }
    }

    // Random cases
    for (let i = 0; i < randomCount; i++) {
      const n = this.randomInt(nMin, nMax);
      inputs.push(this.generateInputForN(constraints, n));
    }

    return inputs;
  }

  /**
   * Generates inputs for dynamic programming problems
   * Strategy: Mix of edge cases and random cases
   */
  private static generateDynamicProgrammingInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const nMax = ConstraintParser.getMaxValue(constraints, 'n', 100);
    const nMin = ConstraintParser.getMinValue(constraints, 'n', 1);

    const edgeCount = Math.floor(count * 0.3);
    const randomCount = count - edgeCount;

    // Edge cases
    for (let i = 0; i < edgeCount; i++) {
      if (i === 0 && nMin <= 1) {
        inputs.push(this.generateInputForN(constraints, 1));
      } else if (i === 1 && nMax >= 1) {
        inputs.push(this.generateInputForN(constraints, nMax));
      } else {
        inputs.push(this.generateInputForN(constraints, nMin));
      }
    }

    // Random cases
    for (let i = 0; i < randomCount; i++) {
      const n = this.randomInt(nMin, nMax);
      inputs.push(this.generateInputForN(constraints, n));
    }

    return inputs;
  }

  /**
   * Generates inputs for math problems
   * Strategy: Edge cases with special values (0, 1, powers of 2, etc.)
   */
  private static generateMathInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const nMax = ConstraintParser.getMaxValue(constraints, 'n', 10**9);
    const nMin = ConstraintParser.getMinValue(constraints, 'n', 1);

    const edgeCount = Math.floor(count * 0.4);
    const randomCount = count - edgeCount;

    // Edge cases with special values
    const specialValues = [1, 2, 10, 100, 1000];
    for (let i = 0; i < edgeCount; i++) {
      if (i < specialValues.length && specialValues[i] <= nMax && specialValues[i] >= nMin) {
        inputs.push(this.generateInputForN(constraints, specialValues[i]));
      } else {
        inputs.push(this.generateInputForN(constraints, nMin));
      }
    }

    // Random cases
    for (let i = 0; i < randomCount; i++) {
      const n = this.randomInt(nMin, nMax);
      inputs.push(this.generateInputForN(constraints, n));
    }

    return inputs;
  }

  /**
   * Generates inputs for string problems
   * Strategy: Edge cases (empty, single char, all same, palindrome) and random strings
   */
  private static generateStringInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const stringVar = constraints.variables.find(v => v.isString);
    
    if (!stringVar) {
      // Fallback to numeric if no string variable found
      return this.generateDefaultInputs(count, constraints);
    }

    const lengthConstraints = ConstraintParser.getStringLength(constraints, stringVar.name);
    const lenMin = lengthConstraints.min;
    const lenMax = lengthConstraints.max;

    const edgeCount = Math.floor(count * 0.3);
    const randomCount = count - edgeCount;

    // Edge cases
    for (let i = 0; i < edgeCount; i++) {
      if (i === 0 && lenMin <= 1) {
        // Single character
        inputs.push(this.generateStringInput(constraints, 1));
      } else if (i === 1 && lenMax >= 1) {
        // Maximum length
        inputs.push(this.generateStringInput(constraints, lenMax));
      } else if (i === 2) {
        // Empty string (if allowed)
        if (lenMin === 0) {
          inputs.push(this.generateStringInput(constraints, 0));
        } else {
          inputs.push(this.generateStringInput(constraints, lenMin));
        }
      } else {
        inputs.push(this.generateStringInput(constraints, lenMin));
      }
    }

    // Random cases
    for (let i = 0; i < randomCount; i++) {
      const len = this.randomInt(lenMin, lenMax);
      inputs.push(this.generateStringInput(constraints, len));
    }

    return inputs;
  }

  /**
   * Generates default inputs (generic strategy)
   */
  private static generateDefaultInputs(
    count: number,
    constraints: ParsedConstraints
  ): string[] {
    const inputs: string[] = [];
    const nMax = ConstraintParser.getMaxValue(constraints, 'n', 100);
    const nMin = ConstraintParser.getMinValue(constraints, 'n', 1);

    const edgeCount = Math.floor(count * 0.2);
    const randomCount = count - edgeCount;

    // Edge cases
    for (let i = 0; i < edgeCount; i++) {
      if (i === 0 && nMin <= 1) {
        inputs.push(this.generateInputForN(constraints, 1));
      } else if (i === 1 && nMax >= 1) {
        inputs.push(this.generateInputForN(constraints, nMax));
      } else {
        inputs.push(this.generateInputForN(constraints, nMin));
      }
    }

    // Random cases
    for (let i = 0; i < randomCount; i++) {
      const n = this.randomInt(nMin, nMax);
      inputs.push(this.generateInputForN(constraints, n));
    }

    return inputs;
  }

  /**
   * Generates input for a specific value of n
   */
  private static generateInputForN(
    constraints: ParsedConstraints,
    n: number
  ): string {
    // Check if there's a string variable
    const stringVar = constraints.variables.find(v => v.isString);
    if (stringVar) {
      return this.generateStringInput(constraints, n);
    }

    // Check if there's an array variable
    const arrayVar = constraints.variables.find(v => v.isArray && !v.isString);
    if (arrayVar) {
      const valueMax = ConstraintParser.getMaxValue(constraints, arrayVar.name, 10**9);
      const valueMin = ConstraintParser.getMinValue(constraints, arrayVar.name, -(10**9));
      const arr = this.generateRandomArray(n, valueMin, valueMax);
      return this.formatArrayInput(n, arr, constraints);
    }

    // Simple case: just n
    return `${n}`;
  }

  /**
   * Generates string input with given length
   */
  private static generateStringInput(
    constraints: ParsedConstraints,
    length: number
  ): string {
    if (length === 0) {
      return '';
    }

    const stringVar = constraints.variables.find(v => v.isString);
    if (!stringVar) {
      return this.generateRandomString(length);
    }

    // Check if there are multiple strings (e.g., n strings)
    const nVar = constraints.variables.find(v => v.name === 'n' && !v.isString);
    if (nVar) {
      // Generate n strings
      const strings: string[] = [];
      for (let i = 0; i < length; i++) {
        const strLen = ConstraintParser.getStringLength(constraints, stringVar.name);
        const len = this.randomInt(strLen.min, strLen.max);
        strings.push(this.generateRandomString(len));
      }
      return `${length}\n${strings.join('\n')}`;
    }

    // Single string
    return this.generateRandomString(length);
  }

  /**
   * Generates a random string with given length
   * Includes various patterns: random, all same char, palindrome, lowercase, uppercase, mixed
   */
  private static generateRandomString(length: number): string {
    const patterns = [
      () => this.generateRandomPattern(length), // Random
      () => this.generateSameCharPattern(length), // All same
      () => this.generatePalindromePattern(length), // Palindrome
      () => this.generateLowercasePattern(length), // Lowercase only
      () => this.generateUppercasePattern(length), // Uppercase only
      () => this.generateMixedCasePattern(length) // Mixed case
    ];

    // Randomly choose a pattern, but favor random (50% chance)
    if (Math.random() < 0.5) {
      return patterns[0]();
    } else {
      const pattern = patterns[this.randomInt(1, patterns.length - 1)];
      return pattern();
    }
  }

  /**
   * Generates random string with mixed characters
   */
  private static generateRandomPattern(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[this.randomInt(0, chars.length - 1)];
    }
    return result;
  }

  /**
   * Generates string with all same character
   */
  private static generateSameCharPattern(length: number): string {
    const char = 'abcdefghijklmnopqrstuvwxyz'[this.randomInt(0, 25)];
    return char.repeat(length);
  }

  /**
   * Generates palindrome string
   */
  private static generatePalindromePattern(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const half = Math.floor(length / 2);
    let result = '';
    
    for (let i = 0; i < half; i++) {
      result += chars[this.randomInt(0, chars.length - 1)];
    }
    
    if (length % 2 === 1) {
      result += chars[this.randomInt(0, chars.length - 1)];
    }
    
    // Mirror the first half
    result += result.substring(0, half).split('').reverse().join('');
    
    return result;
  }

  /**
   * Generates lowercase string
   */
  private static generateLowercasePattern(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[this.randomInt(0, chars.length - 1)];
    }
    return result;
  }

  /**
   * Generates uppercase string
   */
  private static generateUppercasePattern(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[this.randomInt(0, chars.length - 1)];
    }
    return result;
  }

  /**
   * Generates mixed case string
   */
  private static generateMixedCasePattern(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[this.randomInt(0, chars.length - 1)];
    }
    return result;
  }

  /**
   * Generates graph input (n nodes, m edges)
   */
  private static generateGraphInput(
    n: number,
    m: number,
    _constraints: ParsedConstraints
  ): string {
    const edges: string[] = [];
    const used = new Set<string>();

    // Generate edges
    for (let i = 0; i < m; i++) {
      let u: number, v: number;
      let attempts = 0;
      do {
        u = this.randomInt(1, n);
        v = this.randomInt(1, n);
        attempts++;
      } while ((u === v || used.has(`${u}-${v}`) || used.has(`${v}-${u}`)) && attempts < 100);

      if (attempts < 100) {
        used.add(`${u}-${v}`);
        edges.push(`${u} ${v}`);
      }
    }

    return `${n} ${edges.length}\n${edges.join('\n')}`;
  }

  /**
   * Generates a sorted array
   */
  private static generateSortedArray(
    n: number,
    min: number,
    max: number,
    ascending: boolean
  ): number[] {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      const value = min + Math.floor((max - min) * i / Math.max(n - 1, 1));
      arr.push(value);
    }
    if (!ascending) {
      arr.reverse();
    }
    return arr;
  }

  /**
   * Generates a random array
   */
  private static generateRandomArray(
    n: number,
    min: number,
    max: number
  ): number[] {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      arr.push(this.randomInt(min, max));
    }
    return arr;
  }

  /**
   * Generates an array with duplicates
   */
  private static generateArrayWithDuplicates(
    n: number,
    min: number,
    max: number
  ): number[] {
    const arr: number[] = [];
    const uniqueValue = this.randomInt(min, max);
    const duplicateCount = Math.floor(n * 0.3); // 30% duplicates

    for (let i = 0; i < duplicateCount; i++) {
      arr.push(uniqueValue);
    }

    for (let i = duplicateCount; i < n; i++) {
      arr.push(this.randomInt(min, max));
    }

    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  /**
   * Formats array input based on constraints
   */
  private static formatArrayInput(
    n: number,
    arr: number[],
    _constraints: ParsedConstraints
  ): string {
    // Common format: first line has n, second line has array
    return `${n}\n${arr.join(' ')}`;
  }

  /**
   * Generates a random integer between min and max (inclusive)
   */
  private static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

