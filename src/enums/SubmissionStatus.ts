/**
 * Enum de status de submissão (baseado em Judge0)
 */
export enum SubmissionStatus {
  // Estados de fila
  PENDING = 'pending',
  IN_QUEUE = 'in_queue',
  PROCESSING = 'processing',
  
  // Resultados finais
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  COMPILATION_ERROR = 'compilation_error',
  RUNTIME_ERROR = 'runtime_error',
  
  // Estados customizados
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Mapeia Judge0 status IDs para SubmissionStatus
 */
export const JUDGE0_STATUS_MAP: Record<number, SubmissionStatus> = {
  1: SubmissionStatus.IN_QUEUE,
  2: SubmissionStatus.PROCESSING,
  3: SubmissionStatus.ACCEPTED,
  4: SubmissionStatus.WRONG_ANSWER,
  5: SubmissionStatus.TIME_LIMIT_EXCEEDED,
  6: SubmissionStatus.COMPILATION_ERROR,
  7: SubmissionStatus.RUNTIME_ERROR,
  // Adicionar outros códigos conforme necessário
};

