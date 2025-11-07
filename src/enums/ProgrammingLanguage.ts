/**
 * Programming Language Enumeration
 * 
 * Defines supported programming languages for code submission.
 * 
 * @enum {string}
 */
export enum ProgrammingLanguage {
  /** Python programming language */
  PYTHON = 'python',
  
  /** Java programming language */
  JAVA = 'java',
  
  /** C++ programming language */
  CPP = 'cpp',
  
  /** C programming language */
  C = 'c',
  
  /** JavaScript programming language */
  JAVASCRIPT = 'javascript',
  
  /** TypeScript programming language */
  TYPESCRIPT = 'typescript'
}

/**
 * Judge0 Language ID Mappings
 * 
 * Maps ProgrammingLanguage enum values to their corresponding Judge0 API language IDs.
 * These IDs are required when submitting code to Judge0.
 * 
 * @see {@link https://judge0.com/languages Judge0 Supported Languages}
 */
export const JUDGE0_LANGUAGE_IDS: Record<ProgrammingLanguage, number> = {
  [ProgrammingLanguage.PYTHON]: 71,
  [ProgrammingLanguage.JAVA]: 62,
  [ProgrammingLanguage.CPP]: 54,
  [ProgrammingLanguage.C]: 50,
  [ProgrammingLanguage.JAVASCRIPT]: 63,
  [ProgrammingLanguage.TYPESCRIPT]: 74
};

