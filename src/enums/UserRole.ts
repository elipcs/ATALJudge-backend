/**
 * Enum de papéis de usuário no sistema
 */
export enum UserRole {
  STUDENT = 'student',
  ASSISTANT = 'assistant',
  PROFESSOR = 'professor'
}

/**
 * Retorna todos os papéis disponíveis
 */
export function getAllUserRoles(): string[] {
  return Object.values(UserRole);
}

