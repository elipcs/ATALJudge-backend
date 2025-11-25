/**
 * Enums Module Exports
 * 
 * Central export point for all application enumerations including:
 * - User roles and permissions
 * - Judge system types and verdicts
 * - Programming languages and their Judge0 mappings
 * - Submission lifecycle statuses
 * 
 * @module enums
 */
export { UserRole, getAllUserRoles } from './UserRole';
export { JudgeVerdict } from './JudgeVerdict';
export { SubmissionStatus } from './SubmissionStatus';
export { ProgrammingLanguage, JUDGE0_LANGUAGE_IDS } from './ProgrammingLanguage';

