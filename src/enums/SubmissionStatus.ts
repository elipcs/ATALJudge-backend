/**
 * Submission Status Enumeration
 * 
 * Represents the lifecycle states of a code submission from submission to completion.
 * 
 * @enum {string}
 */
export enum SubmissionStatus {
  /**  Submission created but not yet queued */
  PENDING = 'pending',
  
  /** Submission is waiting in the judge queue */
  IN_QUEUE = 'in_queue',
  
  /** Submission is being processed by judge system */
  PROCESSING = 'processing',
  
  /** Submission code is currently running */
  RUNNING = 'running',

  /** Code passed all test cases */
  ACCEPTED = 'accepted',
  
  /** Code output doesn't match expected results */
  WRONG_ANSWER = 'wrong_answer',
  
  /** Code execution exceeded time limit */
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  
  /** Code has compilation errors */
  COMPILATION_ERROR = 'compilation_error',
  
  /** Code crashed during execution */
  RUNTIME_ERROR = 'runtime_error',

  /** Submission processing completed */
  COMPLETED = 'completed',
  
  /** An error occurred during submission processing */
  ERROR = 'error'
}

/**
 * Judge0 Status Code to Submission Status Mapping
 * 
 * Maps Judge0 API status codes to internal SubmissionStatus enum values.
 * 
 * @see {@link https://judge0.com/ Judge0 API Documentation}
 */
export const JUDGE0_STATUS_MAP: Record<number, SubmissionStatus> = {
  1: SubmissionStatus.IN_QUEUE,
  2: SubmissionStatus.PROCESSING,
  3: SubmissionStatus.ACCEPTED,
  4: SubmissionStatus.WRONG_ANSWER,
  5: SubmissionStatus.TIME_LIMIT_EXCEEDED,
  6: SubmissionStatus.COMPILATION_ERROR,
  7: SubmissionStatus.RUNTIME_ERROR,
  
};

