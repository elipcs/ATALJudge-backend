/**
 * User Role Enumeration
 * 
 * Defines the available user roles in the application.
 * Used for role-based access control (RBAC).
 * 
 * @enum {string}
 */
export enum UserRole {
  /** Student role - can submit solutions and view grades */
  STUDENT = 'student',
  
  /** Assistant role - can help manage classes and grade submissions */
  ASSISTANT = 'assistant',
  
  /** Professor role - full control over courses, questions, and grading */
  PROFESSOR = 'professor'
}

/**
 * Retrieves all available user roles
 * 
 * @returns {string[]} Array of all user role values
 * @example
 * const roles = getAllUserRoles(); // ['student', 'assistant', 'professor']
 */
export function getAllUserRoles(): string[] {
  return Object.values(UserRole);
}

