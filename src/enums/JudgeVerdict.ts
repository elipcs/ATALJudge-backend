/**
 * Judge Verdict Enumeration
 * 
 * Represents the possible verdicts/results from code submission evaluation.
 * Used in Judge0 API responses.
 * 
 * @enum {string}
 * @see {@link https://judge0.com/ Judge0 Documentation}
 */
export enum JudgeVerdict {
  /** Code compiled and passed all test cases */
  ACCEPTED = 'Accepted',
  
  /** Code compiled but output doesn't match expected results */
  WRONG_ANSWER = 'Wrong Answer',
  
  /** Code execution exceeded time limit */
  TIME_LIMIT_EXCEEDED = 'Time Limit Exceeded',
  
  /** Code execution exceeded memory limit */
  MEMORY_LIMIT_EXCEEDED = 'Memory Limit Exceeded',
  
  /** Code compiled but crashed during execution */
  RUNTIME_ERROR = 'Runtime Error',
  
  /** Code has syntax or compilation errors */
  COMPILATION_ERROR = 'Compilation Error',
  
  /** Output format doesn't match (e.g., extra whitespace) */
  PRESENTATION_ERROR = 'Presentation Error',
  
  /** Judge system internal error */
  INTERNAL_ERROR = 'Internal Error',
  
  /** Judge system error */
  JUDGE_ERROR = 'Judge Error'
}

