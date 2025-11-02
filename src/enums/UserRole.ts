

export enum UserRole {
  STUDENT = 'student',
  ASSISTANT = 'assistant',
  PROFESSOR = 'professor'
}

export function getAllUserRoles(): string[] {
  return Object.values(UserRole);
}

