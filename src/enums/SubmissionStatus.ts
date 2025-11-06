

export enum SubmissionStatus {
  
  PENDING = 'pending',
  IN_QUEUE = 'in_queue',
  PROCESSING = 'processing',
  RUNNING = 'running',

  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  COMPILATION_ERROR = 'compilation_error',
  RUNTIME_ERROR = 'runtime_error',

  COMPLETED = 'completed',
  ERROR = 'error'
}

export const JUDGE0_STATUS_MAP: Record<number, SubmissionStatus> = {
  1: SubmissionStatus.IN_QUEUE,
  2: SubmissionStatus.PROCESSING,
  3: SubmissionStatus.ACCEPTED,
  4: SubmissionStatus.WRONG_ANSWER,
  5: SubmissionStatus.TIME_LIMIT_EXCEEDED,
  6: SubmissionStatus.COMPILATION_ERROR,
  7: SubmissionStatus.RUNTIME_ERROR,
  
};

